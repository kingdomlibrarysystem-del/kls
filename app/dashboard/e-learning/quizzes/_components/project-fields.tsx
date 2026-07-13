'use client'

import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { projectSubmissionFormatLabels, type ProjectSubmissionFormat } from '@/app/member/_shared/assessment-data'
import type { QuizFormData } from './quiz-form-schema'

interface ProjectFieldsProps {
  register: UseFormRegister<QuizFormData>
  errors: FieldErrors<QuizFormData>
}

/**
 * Authoring fields for a PROJECT (hackathon-style) assessment — a brief
 * and a submission format, shown instead of `QuestionBuilder` since a
 * project has no question list at all. Rendered by Add/Edit quiz modals
 * only when `kind === 'PROJECT'`.
 */
export function ProjectFields({ register, errors }: ProjectFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor="project-brief" required>Project Brief</FieldLabel>
        <textarea
          id="project-brief"
          rows={5}
          placeholder="Describe the hackathon-style challenge the member must complete and submit…"
          aria-label="Project brief"
          className={`w-full px-3 py-2 font-lato text-sm border rounded transition-colors focus:outline-none resize-vertical ${
            errors.brief ? 'border-red-500 bg-red-50' : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
          }`}
          {...register('brief')}
        />
        {errors.brief && <p className="text-red-600 text-xs mt-1 font-lato">{errors.brief.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="project-submission-format" required>Submission Format</FieldLabel>
          <select
            id="project-submission-format"
            className="w-full px-3 py-2 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register('submissionFormat')}
          >
            <option value="">Select format…</option>
            {(Object.keys(projectSubmissionFormatLabels) as ProjectSubmissionFormat[]).map((f) => (
              <option key={f} value={f}>{projectSubmissionFormatLabels[f]}</option>
            ))}
          </select>
          {errors.submissionFormat && <p className="text-red-600 text-xs mt-1 font-lato">{errors.submissionFormat.message}</p>}
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
