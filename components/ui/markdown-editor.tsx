'use client'

import dynamic from 'next/dynamic'
import 'md-editor-rt/lib/style.css'
import { configureMarkdownEditor } from './markdown-editor-config'

const MdEditor = dynamic(() => import('md-editor-rt').then((m) => m.MdEditor), { ssr: false })

configureMarkdownEditor()

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

/**
 * Real markdown authoring editor for lesson content — one lesson can
 * freely mix headings, paragraphs, images, and code blocks in a single
 * document, replacing the old one-contentType-per-lesson model. The
 * toolbar's built-in image button uploads through the real
 * /api/uploads route (a signed server-side Cloudinary upload), inserting
 * a real markdown ![](url) at the cursor. To embed a video, an author
 * pastes a YouTube link on its own line — the member-facing renderer
 * (components/ui/markdown-content.tsx) turns that into a real iframe.
 */
export function MarkdownEditor({ value, onChange, height = 360 }: MarkdownEditorProps) {
  return (
    <MdEditor
      modelValue={value}
      onChange={onChange}
      language="en-US"
      style={{ height }}
      onUploadImg={async (files, callback) => {
        const uploaded = await Promise.all(
          files.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/uploads', { method: 'POST', body: formData })
            const json = await res.json()
            if (json.code !== 'success') throw new Error(json.message ?? 'Upload failed')
            return json.data.url as string
          })
        )
        callback(uploaded)
      }}
    />
  )
}
