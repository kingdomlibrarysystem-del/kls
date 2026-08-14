'use client'

import { useRef } from 'react'
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from 'next-cloudinary'
import { UploadCloud, X } from 'lucide-react'
import Image from 'next/image'

interface CloudinaryResult {
  secure_url: string
}

interface SingleUploaderProps {
  multiple?: false
  value?: string
  onChange: (url: string) => void
}

interface MultiUploaderProps {
  multiple: true
  value?: string[]
  onChange: (urls: string[]) => void
}

type ImageUploaderProps = (SingleUploaderProps | MultiUploaderProps) & {
  disabled?: boolean
  /** Cloudinary folder to upload into — keeps different features' uploads organized in one account. */
  folder?: string
}

/**
 * Real Cloudinary image upload widget, using this app's actual
 * NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME/NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
 * env vars (already present in .env; see PROGRESS.md's markdown-lesson-
 * editor entry for the one-time unsigned-preset setup this depends on).
 * Single mode returns one URL; multiple mode accumulates a list — used
 * by the lesson markdown editor to insert real image URLs into content.
 */
export function ImageUploader(props: ImageUploaderProps) {
  const { multiple = false, disabled, folder } = props
  // Keep a mutable ref so successive onSuccess callbacks always see the latest list.
  const accumulatedRef = useRef<string[]>([])

  const handleSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.event !== 'success') return
    const url = (result.info as CloudinaryResult).secure_url
    if (multiple) {
      accumulatedRef.current = [...accumulatedRef.current, url]
      ;(props as MultiUploaderProps).onChange([...accumulatedRef.current])
    } else {
      ;(props as SingleUploaderProps).onChange(url)
    }
  }

  const handleOpen = (open: () => void) => {
    if (multiple) {
      accumulatedRef.current = [...((props as MultiUploaderProps).value ?? [])]
    }
    open()
  }

  const removeMultiple = (index: number) => {
    const current = [...((props as MultiUploaderProps).value ?? [])]
    current.splice(index, 1)
    ;(props as MultiUploaderProps).onChange(current)
  }

  const singleUrl = !multiple ? (props as SingleUploaderProps).value : undefined
  const multiUrls = multiple ? (props as MultiUploaderProps).value ?? [] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {singleUrl && (
        <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border, #d4d4d8)' }}>
          <Image src={singleUrl} alt="Uploaded" fill style={{ objectFit: 'cover' }} sizes="100vw" />
          <button
            type="button"
            onClick={() => (props as SingleUploaderProps).onChange('')}
            aria-label="Remove image"
            style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {multiple && multiUrls.length > 0 && (
        <div className="grid grid-cols-3" style={{ display: 'grid', gap: 8 }}>
          {multiUrls.map((url, i) => (
            <div key={i} style={{ position: 'relative', height: 96, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border, #d4d4d8)' }}>
              <Image src={url} alt={`Image ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="33vw" />
              <button
                type="button"
                onClick={() => removeMultiple(i)}
                aria-label={`Remove image ${i + 1}`}
                style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <CldUploadWidget
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
        options={{
          sources: ['local', 'url', 'unsplash'],
          multiple,
          maxFiles: multiple ? 15 : 1,
          folder: folder ?? 'kcs-lessons',
        }}
        onSuccess={handleSuccess}
      >
        {({ open }) => (
          <button
            type="button"
            onClick={() => open && handleOpen(open)}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 64, padding: 12,
              borderRadius: 8, border: '1px dashed var(--border, #d4d4d8)', background: 'transparent', color: 'var(--text-muted, #71717a)',
              fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
            }}
          >
            <UploadCloud size={16} />
            {multiple ? 'Upload Images' : 'Upload Image'}
          </button>
        )}
      </CldUploadWidget>
    </div>
  )
}
