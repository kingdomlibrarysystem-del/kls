'use client'

import { useState } from 'react'
import { FieldLabel } from '@/components/ui/field-label'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import type { LessonFormData } from './lesson-form-schema'

interface LessonMediaUploadProps {
  contentType: LessonFormData['contentType']
  onInsert: (markdownToAppend: string) => void
}

/**
 * File/video uploader shown above the markdown editor when Content Type is
 * File or Video — Lesson has no separate file/video-URL column (the body
 * always lives in contentMarkdown, see prisma/schema.prisma's Lesson.
 * contentMarkdown comment), so a successful upload appends a real embed
 * (a markdown link for File, a bare URL line for Video — the same shape
 * the member-facing renderer already turns into a real <iframe>) into the
 * markdown body below, exactly like the editor's own image button does.
 */
export function LessonMediaUpload({ contentType, onInsert }: LessonMediaUploadProps) {
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')

  if (contentType !== 'FILE' && contentType !== 'VIDEO') return null

  const isVideo = contentType === 'VIDEO'
  const label = isVideo ? 'Lesson Video' : 'Lesson File'

  return (
    <div>
      <FieldLabel htmlFor="lesson-media-upload">{label}</FieldLabel>
      <CloudinaryUploadField
        id="lesson-media-upload"
        kind={isVideo ? 'video' : 'document'}
        accept={isVideo ? 'video/*' : 'application/pdf'}
        label={label}
        value={url}
        fileName={fileName}
        onUploaded={(result) => {
          setUrl(result.url)
          setFileName(result.fileName)
          onInsert(isVideo ? `\n${result.url}\n` : `\n[${result.fileName}](${result.url})\n`)
        }}
        onClear={() => { setUrl(''); setFileName('') }}
      />
      <p className="font-lato text-xs text-w-600 mt-1">
        Uploading adds a real {isVideo ? 'video embed' : 'file link'} into Lesson Content below — add any surrounding notes there too.
      </p>
    </div>
  )
}
