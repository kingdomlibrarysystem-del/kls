'use client'

import { Controller, type Control } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { FilePickerField } from '@/components/ui/file-picker-field'
import type { ResourceFormData } from './resource-form-schema'

interface ResourceFormMediaFilesProps {
  control: Control<ResourceFormData>
}

interface MediaFieldProps {
  control: Control<ResourceFormData>
  id: string
  urlName: 'documentUrl' | 'audioUrl' | 'videoUrl'
  nameName: 'documentName' | 'audioName' | 'videoName'
  accept: string
  label: string
  pickerLabel: string
}

function MediaField({ control, id, urlName, nameName, accept, label, pickerLabel }: MediaFieldProps) {
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
              <FilePickerField
                id={id}
                accept={accept}
                label={pickerLabel}
                value={urlField.value ?? ''}
                fileName={nameField.value}
                onChange={(blobUrl, fileName) => { urlField.onChange(blobUrl); nameField.onChange(fileName) }}
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
 * Optional document/audio/video file fields for a Resource — split out of
 * resource-form-details.tsx to keep it under the 200-line cap. Blob-URL
 * only, no real backend to upload to in this prototype (see
 * FilePickerField's docstring).
 */
export function ResourceFormMediaFiles({ control }: ResourceFormMediaFilesProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <MediaField control={control} id="documentFile" urlName="documentUrl" nameName="documentName" accept=".pdf,.doc,.docx" label="Document / PDF" pickerLabel="Upload document" />
        <MediaField control={control} id="audioFile" urlName="audioUrl" nameName="audioName" accept="audio/*" label="Audio (optional)" pickerLabel="Upload audio" />
      </div>
      <MediaField control={control} id="videoFile" urlName="videoUrl" nameName="videoName" accept="video/*" label="Video (optional)" pickerLabel="Upload video" />
    </>
  )
}
