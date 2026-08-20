'use client'

import dynamic from 'next/dynamic'
import { Controller, type Control, type UseFormSetValue, type UseFormWatch } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { CloudinaryUploadField, type UploadKind } from '@/components/ui/cloudinary-upload-field'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { FormInput } from '@/components/ui/form-input'
import type { ResourceFormData } from './resource-form-schema'

// react-pdf's Document/Page ultimately need pdfjs-dist's browser build
// (DOMMatrix, etc.), which doesn't exist in Node — /dashboard/library is
// a statically-prerendered page, so a plain import here would run this
// module at build time and throw "DOMMatrix is not defined" (confirmed:
// this exact error broke the production build before this fix). The
// member-facing PdfReaderView avoids this because its route is
// server-rendered on demand, not statically prerendered.
const PdfPreview = dynamic(() => import('@/components/ui/pdf-preview').then((m) => m.PdfPreview), { ssr: false })

interface ResourceFormMediaFilesProps {
  control: Control<ResourceFormData>
  setValue: UseFormSetValue<ResourceFormData>
  watch: UseFormWatch<ResourceFormData>
  mediaType: ResourceFormData['mediaType']
  /** Only true for a brand-new resource — editing an existing one manages chapters through the real chapter-authoring flow, not this one-shot "first chapter" field. */
  isCreating: boolean
}

interface MediaFieldProps {
  control: Control<ResourceFormData>
  id: string
  kind: UploadKind
  urlName: 'documentUrl' | 'audioUrl' | 'videoUrl'
  nameName: 'documentName' | 'audioName' | 'videoName'
  accept: string
  label: string
  onUploaded?: (result: { url: string; fileName: string; pages?: number }) => void
}

function MediaField({ control, id, kind, urlName, nameName, accept, label, onUploaded }: MediaFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        name={urlName}
        control={control}
        render={({ field: urlField }) => (
          <Controller
            name={nameName}
            control={control}
            render={({ field: nameField }) => (
              <CloudinaryUploadField
                id={id}
                kind={kind}
                accept={accept}
                label={label}
                value={urlField.value ?? ''}
                fileName={nameField.value}
                onUploaded={(result) => {
                  urlField.onChange(result.url)
                  nameField.onChange(result.fileName)
                  onUploaded?.(result)
                }}
                onClear={() => { urlField.onChange(''); nameField.onChange('') }}
              />
            )}
          />
        )}
      />
    </div>
  )
}

/**
 * Document/audio/video/markdown field for a Resource — only the field
 * matching the selected `mediaType` is shown. A TEXT resource is
 * authored directly as real markdown (creates a real first Chapter row
 * via POST /api/chapters right after the Resource itself — see
 * resource-form-modal.tsx's onSubmit) rather than uploading a PDF,
 * since a pure-text book's real readable content lives in Chapter rows,
 * not a document file. DOCUMENT/COMBINATION keep the PDF picker (which
 * also auto-fills Pages from the file's real extracted page count).
 */
export function ResourceFormMediaFiles({ control, setValue, watch, mediaType, isCreating }: ResourceFormMediaFilesProps) {
  const showMarkdown = isCreating && mediaType === 'TEXT'
  const showDocument = mediaType === 'DOCUMENT' || mediaType === 'COMBINATION'
  const showAudio = mediaType === 'VIDEO' || mediaType === 'COMBINATION'
  const showVideo = mediaType === 'VIDEO' || mediaType === 'COMBINATION'
  const documentUrl = watch('documentUrl')

  return (
    <>
      {showMarkdown && (
        <div>
          <FieldLabel htmlFor="chapterTitle">First Chapter (optional)</FieldLabel>
          <Controller
            name="chapterTitle"
            control={control}
            render={({ field }) => (
              <FormInput id="chapterTitle" type="text" placeholder="Chapter title, e.g. Chapter 1" value={field.value ?? ''} onChange={field.onChange} />
            )}
          />
          <div className="mt-2">
            <Controller
              name="chapterContent"
              control={control}
              render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} height={280} />}
            />
          </div>
          <p className="font-lato text-xs text-w-600 mt-1">
            Creates this resource's real first chapter. More chapters can be added afterward from the resource's own page.
          </p>
        </div>
      )}

      {(showDocument || showAudio || showVideo) && (
        <div className="grid grid-cols-2 gap-4">
          {showDocument && (
            <div>
              <MediaField
                control={control}
                id="documentFile"
                kind="document"
                urlName="documentUrl"
                nameName="documentName"
                accept="application/pdf"
                label="Document (PDF)"
                onUploaded={(result) => {
                  if (typeof result.pages === 'number' && result.pages > 0) {
                    setValue('pages', result.pages, { shouldValidate: true })
                  }
                }}
              />
              {documentUrl && (
                <div className="mt-2">
                  <PdfPreview url={documentUrl} />
                </div>
              )}
            </div>
          )}
          {showAudio && (
            <MediaField control={control} id="audioFile" kind="audio" urlName="audioUrl" nameName="audioName" accept="audio/*" label="Audio" />
          )}
          {showVideo && (
            <MediaField control={control} id="videoFile" kind="video" urlName="videoUrl" nameName="videoName" accept="video/*" label="Video" />
          )}
        </div>
      )}
    </>
  )
}
