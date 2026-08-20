import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

// Reads the public NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME rather than a
// separate server-only CLOUDINARY_CLOUD_NAME — this app has exactly one
// real Cloudinary account, and CldUploadWidget (components/ui/
// cloudinary-upload-field.tsx, image-uploader.tsx) can only ever read
// the public var, so this signed-upload path uses the same single
// source of truth instead of risking a second, divergent cloud name.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_BYTES = 25 * 1024 * 1024 // 25MB — covers a real PDF/audio/video upload, not just the 10MB image-only ceiling this route started with.

type UploadKind = 'image' | 'document' | 'audio' | 'video'

const ALLOWED_TYPES: Record<UploadKind, Set<string>> = {
  image: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  document: new Set(['application/pdf']),
  audio: new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']),
  video: new Set(['video/mp4', 'video/webm', 'video/quicktime']),
}

/** Cloudinary's own resource_type bucket — audio has no dedicated bucket, it's uploaded as 'video' (Cloudinary's own convention for anything with an audio/video codec). */
const CLOUDINARY_RESOURCE_TYPE: Record<UploadKind, 'image' | 'video' | 'raw'> = {
  image: 'image',
  document: 'raw',
  audio: 'video',
  video: 'video',
}

/**
 * Real page count for an uploaded PDF, read server-side via pdfjs-dist's
 * Node-compatible legacy build — used to auto-fill a Resource's `pages`
 * field from the actual document instead of a manually-typed guess.
 * Failure to parse (a corrupt or non-standard PDF) degrades to
 * `undefined` rather than blocking the upload — page count is a
 * convenience, not a requirement for the file to be usable.
 */
async function countPdfPages(buffer: Buffer): Promise<number | undefined> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    return doc.numPages
  } catch {
    return undefined
  }
}

/**
 * Real signed server-side Cloudinary upload — one shared endpoint for
 * cover images, PDFs, audio, and video, distinguished by the `type`
 * form field. Originally image-only (used by the markdown lesson
 * editor's inline "insert image" button); extended so the admin
 * Resource form's Cover/Document/Audio/Video pickers all go through a
 * real upload instead of a client-only blob: URL that never left the
 * browser.
 */
export const POST = withErrorHandling('/api/uploads', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const formData = await request.formData()
  const file = formData.get('file')
  const kindRaw = formData.get('type')
  const kind: UploadKind = kindRaw === 'document' || kindRaw === 'audio' || kindRaw === 'video' ? kindRaw : 'image'

  if (!(file instanceof File)) throw new ApiError('No file provided', 400)
  if (!ALLOWED_TYPES[kind].has(file.type)) {
    const label = kind === 'document' ? 'PDF' : kind
    throw new ApiError(`Only a valid ${label} file is allowed for this field`, 400)
  }
  if (file.size > MAX_BYTES) throw new ApiError('File exceeds the 25MB upload limit', 400)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const pages = kind === 'document' ? await countPdfPages(buffer) : undefined

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `kcs-resources/${kind}`, resource_type: CLOUDINARY_RESOURCE_TYPE[kind] },
      (error, uploadResult) => {
        if (error || !uploadResult) reject(error ?? new Error('Upload failed'))
        else resolve(uploadResult as { secure_url: string })
      }
    )
    uploadStream.end(buffer)
  })

  return NextResponse.json(
    { data: { url: result.secure_url, fileName: file.name, pages }, message: 'File uploaded successfully', code: 'success', status: 201 },
    { status: 201 }
  )
})
