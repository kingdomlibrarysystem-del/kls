'use client'

import { useRef } from 'react'
import { UploadCloud, X } from 'lucide-react'

interface FilePickerFieldProps {
  id: string
  accept: string
  label: string
  /** Local blob: URL of the currently-picked file, or a pre-existing remote URL when editing. Empty string means nothing picked. */
  value: string
  fileName?: string
  onChange: (blobUrl: string, fileName: string) => void
  onClear: () => void
}

/**
 * Client-side-only file picker: reads a local file via URL.createObjectURL
 * and hands the blob URL back to the caller. There is no real backend in
 * this prototype (no Cloudinary/API upload), so the blob URL is the only
 * artifact produced — it previews/plays for the current browser session but
 * does not persist across a reload, same lifetime as any other in-memory
 * mock-store value in this app.
 */
export function FilePickerField({ id, accept, label, value, fileName, onChange, onClear }: FilePickerFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChange(URL.createObjectURL(file), file.name)
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
          className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-w-400 bg-form-bg rounded cursor-pointer font-lato text-sm text-w-700 hover:border-w-600 transition-colors"
        >
          <UploadCloud size={16} /> Choose file…
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        aria-label={label}
        onChange={handleFileChange}
      />
    </div>
  )
}
