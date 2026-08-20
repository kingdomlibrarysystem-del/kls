'use client'

import { Controller, type Control, type UseFormSetValue } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { CloudinaryUploadField, type UploadKind } from '@/components/ui/cloudinary-upload-field'
import type { ResourceFormData } from './resource-form-schema'

interface ResourceFormMediaFilesProps {
  control: Control<ResourceFormData>
  setValue: UseFormSetValue<ResourceFormData>
  mediaType: ResourceFormData['mediaType']
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
 * Document/audio/video file field for a Resource — only the field
 * matching the selected `mediaType` is shown (a TEXT resource has no
 * business offering an audio/video upload, and COMBINATION shows all
 * three), rather than always showing all three regardless of what the
 * resource actually is. Uploading a PDF also auto-fills the Pages field
 * from its real extracted page count (see /api/uploads), which the
 * admin can still edit afterward.
 */
export function ResourceFormMediaFiles({ control, setValue, mediaType }: ResourceFormMediaFilesProps) {
  const showDocument = mediaType === 'DOCUMENT' || mediaType === 'TEXT' || mediaType === 'COMBINATION'
  const showAudio = mediaType === 'VIDEO' || mediaType === 'COMBINATION'
  const showVideo = mediaType === 'VIDEO' || mediaType === 'COMBINATION'

  if (!showDocument && !showAudio && !showVideo) return null

  return (
    <div className="grid grid-cols-2 gap-4">
      {showDocument && (
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
      )}
      {showAudio && (
        <MediaField control={control} id="audioFile" kind="audio" urlName="audioUrl" nameName="audioName" accept="audio/*" label="Audio" />
      )}
      {showVideo && (
        <MediaField control={control} id="videoFile" kind="video" urlName="videoUrl" nameName="videoName" accept="video/*" label="Video" />
      )}
    </div>
  )
}
