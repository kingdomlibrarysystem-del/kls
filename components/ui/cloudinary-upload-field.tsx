'use client'

import { useRef, useState } from 'react'
import { UploadCloud, X, Loader2 } from 'lucide-react'

export type UploadKind = 'image' | 'document' | 'audio' | 'video'

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

/**
 * Real server-side Cloudinary upload field — replaces FilePickerField's
 * client-only blob: URL (which never left the browser and was useless
 * once sent to the API) for every media field on the admin Resource
 * form. Posts to /api/uploads with a `type` field so the route applies
 * the right MIME allowlist and Cloudinary resource_type per field; for
 * `kind: 'document'`, the response also carries a real extracted PDF
 * page count the caller can use to auto-fill the Pages field.
 */
export function CloudinaryUploadField({ id, accept, label, kind, value, fileName, onUploaded, onClear }: CloudinaryUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', kind)
      const res = await fetch('/api/uploads', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Upload failed')
      onUploaded({ url: json.data.url, fileName: json.data.fileName ?? file.name, pages: json.data.pages })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border border-w-300 bg-w-100 rounded font-lato text-sm text-w-800">
          <span className="truncate">{fileName || label}</span>
          <button
            type="button"
            onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = '' }}
            className="text-w-600 hover:text-red-600 transition-colors shrink-0"
            aria-label={`Remove ${label}`}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed rounded font-lato text-sm transition-colors ${
            uploading ? 'border-w-300 bg-w-50 text-w-500 cursor-wait' : 'border-w-400 bg-form-bg text-w-700 hover:border-w-600 cursor-pointer'
          }`}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          {uploading ? 'Uploading…' : 'Choose file…'}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        aria-label={label}
        disabled={uploading}
        onChange={handleFileChange}
      />
      {error && <p className="text-red-600 text-xs mt-1 font-lato">{error}</p>}
    </div>
  )
}
