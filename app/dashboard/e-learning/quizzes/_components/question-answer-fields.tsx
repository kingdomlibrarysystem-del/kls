'use client'

import type { Control, UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { FormInput } from '@/components/ui/form-input'
import type { QuizFormData } from './quiz-form-schema'

interface QuestionAnswerFieldsProps {
  qIndex: number
  type: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'OPEN'
  correctOptionIndex?: number
  correctOptionIndices?: number[]
  register: UseFormRegister<QuizFormData>
  setValue: UseFormSetValue<QuizFormData>
  errors: FieldErrors<QuizFormData>
  control?: Control<QuizFormData>
}

const OPTION_SLOTS = [0, 1, 2, 3]

/**
 * Renders the answer-input area for one question, switching shape by type:
 * a radio group (single correct answer) for SINGLE_SELECT, a checkbox group
 * (any number of correct answers) for MULTI_SELECT, or a note explaining
 * open-ended answers aren't auto-graded for OPEN — no correct-answer input
 * is offered for OPEN since nothing would consume it yet (Phase B).
 */
export function QuestionAnswerFields({ qIndex, type, correctOptionIndex, correctOptionIndices, register, setValue, errors }: QuestionAnswerFieldsProps) {
  if (type === 'OPEN') {
    return (
      <p className="text-xs text-w-600 italic bg-w-100 border border-w-300 rounded p-2">
        Open-ended questions are answered as free text by the member and are not auto-graded — they require manual review after submission.
      </p>
    )
  }

  const isMulti = type === 'MULTI_SELECT'

  const toggleMultiOption = (oIndex: number) => {
    const current = correctOptionIndices ?? []
    const next = current.includes(oIndex) ? current.filter((i) => i !== oIndex) : [...current, oIndex].sort()
    setValue(`questions.${qIndex}.correctOptionIndices`, next, { shouldValidate: true })
  }

  const setSingleOption = (oIndex: number) => {
    setValue(`questions.${qIndex}.correctOptionIndex`, oIndex, { shouldValidate: true })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-w-600">{isMulti ? 'Check every correct answer' : 'Select the one correct answer'}</p>
      {OPTION_SLOTS.map((oIndex) => (
        <div key={oIndex} className="flex items-center gap-2">
          <input
            type={isMulti ? 'checkbox' : 'radio'}
            name={isMulti ? undefined : `question-${qIndex}-correct`}
            aria-label={`Mark option ${oIndex + 1} as correct for question ${qIndex + 1}`}
            checked={isMulti ? (correctOptionIndices ?? []).includes(oIndex) : correctOptionIndex === oIndex}
            onChange={() => (isMulti ? toggleMultiOption(oIndex) : setSingleOption(oIndex))}
          />
          <FormInput
            placeholder={`Option ${oIndex + 1}${oIndex >= 2 ? ' (optional)' : ''}`}
            aria-label={`Question ${qIndex + 1} option ${oIndex + 1}`}
            className="flex-1"
            {...register(`questions.${qIndex}.options.${oIndex}`)}
          />
        </div>
      ))}
      {errors.questions?.[qIndex]?.options && <p className="text-red-600 text-xs font-lato">{errors.questions[qIndex]?.options?.message}</p>}
      {isMulti && errors.questions?.[qIndex]?.correctOptionIndices && (
        <p className="text-red-600 text-xs font-lato">{errors.questions[qIndex]?.correctOptionIndices?.message}</p>
      )}
      {!isMulti && errors.questions?.[qIndex]?.correctOptionIndex && (
        <p className="text-red-600 text-xs font-lato">{errors.questions[qIndex]?.correctOptionIndex?.message}</p>
      )}
    </div>
  )
}
