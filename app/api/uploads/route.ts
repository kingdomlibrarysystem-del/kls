import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

/**
 * Real signed server-side Cloudinary upload, used by the markdown lesson
 * editor's inline "insert image" toolbar button (md-editor-rt's
 * onUploadImg hands over raw File objects, which the client-side
 * CldUploadWidget can't accept directly — a signed upload using
 * CLOUDINARY_API_SECRET server-side sidesteps needing an unsigned
 * upload preset for this specific flow).
 */
export const POST = withErrorHandling('/api/uploads', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) throw new ApiError('No file provided', 400)
  if (!ALLOWED_TYPES.has(file.type)) throw new ApiError('Only JPEG, PNG, WEBP, or GIF images are allowed', 400)
  if (file.size > MAX_BYTES) throw new ApiError('File exceeds the 10MB upload limit', 400)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'kcs-lessons', resource_type: 'image' },
      (error, uploadResult) => {
        if (error || !uploadResult) reject(error ?? new Error('Upload failed'))
        else resolve(uploadResult as { secure_url: string })
      }
    )
    uploadStream.end(buffer)
  })

  return NextResponse.json({ data: { url: result.secure_url }, message: 'Image uploaded successfully', code: 'success', status: 201 }, { status: 201 })
})
