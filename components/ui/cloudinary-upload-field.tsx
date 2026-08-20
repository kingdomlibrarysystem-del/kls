'use client'

import { useState } from 'react'
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from 'next-cloudinary'
import { UploadCloud, X, Loader2 } from 'lucide-react'

export type UploadKind = 'image' | 'document' | 'audio' | 'video'

interface CloudinaryResult {
  secure_url: string
  original_filename?: string
  format?: string
}

interface CloudinaryUploadFieldProps {
  id: string
  accept: string
  label: string
  kind: UploadKind
  /** Real Cloudinary secure_url of the currently-uploaded file, or a pre-existing remote URL when editing. Empty string means nothing uploaded. */
  value: string
  fileName?: string
  onUploaded: (result: { url: string; fileName: string; pages?: number }) => void
  onClear: () => void
}

/** Cloudinary resource_type bucket per field kind — audio has no dedicated bucket, it uploads as 'video' (Cloudinary's own convention for anything with an audio/video codec). 'auto' lets Cloudinary detect image vs. raw so the same preset covers cover images too. */
const RESOURCE_TYPE: Record<UploadKind, 'auto' | 'video' | 'raw'> = {
  image: 'auto',
  document: 'raw',
  audio: 'video',
  video: 'video',
}

const CLIENT_ALLOWED_FORMATS: Record<UploadKind, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  document: ['pdf'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'mp4'],
  video: ['mp4', 'webm', 'mov'],
}

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

/**
 * Real Cloudinary upload via CldUploadWidget's own drag-and-drop modal
 * UI (client-side, unsigned kls_uploads preset) — replaces the plain
 * <input type="file"> button that, while already a genuine signed
 * server-side Cloudinary upload, didn't match the polished
 * uploader-card UX this project's reference screenshots call for.
 * PDF page-count auto-fill (previously computed during the server-side
 * upload) now happens as a small follow-up call to
 * /api/uploads/pdf-page-count once the widget itself finishes, since a
 * client-side widget upload never passes through this app's own API.
 */
export function CloudinaryUploadField({ id, label, kind, value, fileName, onUploaded, onClear }: CloudinaryUploadFieldProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSuccess = async (result: CloudinaryUploadWidgetResults) => {
    setUploading(false)
    if (result.event !== 'success') return
    const info = result.info as CloudinaryResult
    const name = info.original_filename ? `${info.original_filename}${info.format ? `.${info.format}` : ''}` : label

    let pages: number | undefined
    if (kind === 'document') {
      try {
        const res = await fetch('/api/uploads/pdf-page-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: info.secure_url }),
        })
        const json = await res.json()
        if (res.ok && json.code === 'success') pages = json.data.pages
      } catch {
        // Page count is a convenience auto-fill — a failed lookup shouldn't block using the uploaded file.
      }
    }

    onUploaded({ url: info.secure_url, fileName: name, pages })
  }

  return (
    <div>
      <CldUploadWidget
        uploadPreset={UPLOAD_PRESET}
        options={{
          sources: ['local', 'url'],
          multiple: false,
          maxFiles: 1,
          resourceType: RESOURCE_TYPE[kind],
          clientAllowedFormats: CLIENT_ALLOWED_FORMATS[kind],
          maxFileSize: 25_000_000,
          folder: `kcs-resources/${kind}`,
        }}
        onQueuesStart={() => { setUploading(true); setError('') }}
        onSuccess={handleSuccess}
        onError={(err) => { setUploading(false); setError(typeof err === 'string' ? err : 'Upload failed') }}
      >
        {({ open }) => (
          <button
            type="button"
            id={id}
            onClick={() => open?.()}
            disabled={uploading}
            aria-label={value ? `Replace ${label}` : `Upload ${label}`}
            className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg transition-colors ${
              value ? 'border-w-500 bg-w-100' : uploading ? 'border-w-300 bg-w-50 cursor-wait' : 'border-w-400 bg-form-bg hover:border-w-600'
            }`}
          >
            {uploading ? (
              <Loader2 size={22} className="text-w-500 animate-spin" />
            ) : (
              <UploadCloud size={22} className={value ? 'text-w-700' : 'text-w-500'} />
            )}
            <p className="font-lato text-sm font-semibold text-w-800 truncate max-w-full px-2">
              {uploading ? 'Uploading…' : value ? `${fileName || label} · click to change` : `Upload ${label}`}
            </p>
          </button>
        )}
      </CldUploadWidget>
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1.5 flex items-center gap-1 text-xs text-w-600 hover:text-red-600 transition-colors font-lato"
          aria-label={`Remove ${label}`}
        >
          <X size={12} /> Remove
        </button>
      )}
      {error && <p className="text-red-600 text-xs mt-1 font-lato">{error}</p>}
    </div>
  )
}
