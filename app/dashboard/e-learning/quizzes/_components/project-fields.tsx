'use client'

import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { FileText } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { projectSubmissionFormatLabels, type ProjectSubmissionFormat } from '@/app/member/_shared/assessment-data'
import type { QuizFormData } from './quiz-form-schema'

interface ProjectFieldsProps {
  register: UseFormRegister<QuizFormData>
  errors: FieldErrors<QuizFormData>
  setValue: UseFormSetValue<QuizFormData>
  watch: UseFormWatch<QuizFormData>
}

/**
 * Authoring fields for a PROJECT assessment, shown instead of
 * `QuestionBuilder` (a project has no questions): the project DOCUMENT
 * (PDF, Word, PowerPoint, Excel…) that members open, how they hand their
 * work in, and the total marks. Projects are never typed in the form any
 * more; an older project's typed brief is still shown (read-only) until a
 * document replaces it.
 */
export function ProjectFields({ register, errors, setValue, watch }: ProjectFieldsProps) {
  const fileUrl = watch('briefFileUrl') ?? ''
  const fileName = watch('briefFileName') ?? ''
  const oldBrief = watch('brief')

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor="project-document" required>Project document</FieldLabel>
        <CloudinaryUploadField
          id="project-document"
          kind="office"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.rtf,.txt"
          label="Upload the project (PDF, Word, PowerPoint, Excel)"
          value={fileUrl}
          fileName={fileName}
          onUploaded={(r) => {
            setValue('briefFileUrl', r.url, { shouldValidate: true, shouldDirty: true })
            setValue('briefFileName', r.fileName, { shouldDirty: true })
          }}
          onClear={() => {
            setValue('briefFileUrl', '', { shouldValidate: true, shouldDirty: true })
            setValue('briefFileName', '', { shouldDirty: true })
          }}
        />
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 underline-offset-2 hover:underline dark:text-primary">
            <FileText size={13} /> Open the uploaded document
          </a>
        )}
        {errors.briefFileUrl && <p className="text-red-600 dark:text-destructive text-xs mt-1 font-lato">{errors.briefFileUrl.message}</p>}
        {!fileUrl && oldBrief && (
          <div className="mt-2 rounded border border-w-300 bg-w-50 p-2.5 dark:border-white/15 dark:bg-white/5">
            <p className="font-lato text-[11px] font-semibold uppercase tracking-wide text-w-600">Old typed brief — upload a document to replace it</p>
            <p className="mt-1 whitespace-pre-wrap font-lato text-xs text-w-700 dark:text-muted-foreground">{oldBrief}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="project-submission-format" required>How members hand it in</FieldLabel>
          <select
            id="project-submission-format"
            className="w-full px-3 py-2 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
            {...register('submissionFormat')}
          >
            <option value="">Select format…</option>
            {(Object.keys(projectSubmissionFormatLabels) as ProjectSubmissionFormat[]).map((f) => (
              <option key={f} value={f}>{projectSubmissionFormatLabels[f]}</option>
            ))}
          </select>
          {errors.submissionFormat && <p className="text-red-600 dark:text-destructive text-xs mt-1 font-lato">{errors.submissionFormat.message}</p>}
        </div>

        <div>
          <FieldLabel htmlFor="project-marks" required>Total Marks</FieldLabel>
          <FormInput
            id="project-marks"
            type="number"
            min={1}
            error={errors.projectMarks?.message}
            {...register('projectMarks', { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  )
}
