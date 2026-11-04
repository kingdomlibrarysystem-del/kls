'use client'

import { useFieldArray, type Control, type UseFormRegister, type UseFormSetValue, type FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { FormInput } from '@/components/ui/form-input'
import type { QuizFormData } from './quiz-form-schema'

interface QuestionAnswerFieldsProps {
  qIndex: number
  type: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'OPEN' | 'YES_NO' | 'TRUE_FALSE' | 'MATCHING'
  options?: string[]
  correctOptionIndex?: number
  correctOptionIndices?: number[]
  register: UseFormRegister<QuizFormData>
  setValue: UseFormSetValue<QuizFormData>
  errors: FieldErrors<QuizFormData>
  control: Control<QuizFormData>
}

/**
 * Renders the answer-input area for one question, switching shape by type:
 * - SINGLE_SELECT: radio group with dynamic option count
 * - MULTI_SELECT: checkbox group with dynamic option count
 * - YES_NO: fixed Yes / No radio
 * - TRUE_FALSE: fixed True / False radio
 * - MATCHING: dynamic left/right pair builder
 * - OPEN: note explaining manual review
 */
export function QuestionAnswerFields({ qIndex, type, options, correctOptionIndex, correctOptionIndices, register, setValue, errors, control }: QuestionAnswerFieldsProps) {
  // Primitive string arrays cannot use useFieldArray here: react-hook-form
  // filters falsy array items out of `fields`, so the default `['', '']`
  // produced zero option rows (and an author could never type an answer).
  const optionValues = options ?? []

  const addOption = () => {
    setValue(`questions.${qIndex}.options`, [...optionValues, ''], { shouldValidate: false })
  }

  const removeOptionAt = (oIndex: number) => {
    const next = optionValues.filter((_, i) => i !== oIndex)
    setValue(`questions.${qIndex}.options`, next, { shouldValidate: false })
    if (correctOptionIndex !== undefined) {
      const nextCorrect = correctOptionIndex === oIndex ? 0 : correctOptionIndex > oIndex ? correctOptionIndex - 1 : correctOptionIndex
      setValue(`questions.${qIndex}.correctOptionIndex`, nextCorrect)
    }
    if (correctOptionIndices && correctOptionIndices.length > 0) {
      const nextCorrectIndices = correctOptionIndices.filter((i) => i !== oIndex).map((i) => (i > oIndex ? i - 1 : i))
      setValue(`questions.${qIndex}.correctOptionIndices`, nextCorrectIndices)
    }
  }

  const { fields: pairFields, append: appendPair, remove: removePair } = useFieldArray({
    control,
    name: `questions.${qIndex}.matchingPairs`,
  })

  if (type === 'OPEN') {
    return (
      <p className="text-xs text-w-600 italic bg-w-100 border border-w-300 rounded p-2">
        Open-ended questions are answered as free text by the member and are not auto-graded — they require manual review after submission.
      </p>
    )
  }

  if (type === 'YES_NO') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-w-600">Select the correct answer</p>
        {(['Yes', 'No'] as const).map((label, oIndex) => (
          <div key={label} className="flex items-center gap-2">
            <input
              type="radio"
              name={`question-${qIndex}-correct`}
              aria-label={`Mark "${label}" as correct for question ${qIndex + 1}`}
              checked={correctOptionIndex === oIndex}
              onChange={() => setValue(`questions.${qIndex}.correctOptionIndex`, oIndex, { shouldValidate: true })}
            />
            <span className="text-sm text-w-950">{label}</span>
          </div>
        ))}
        {errors.questions?.[qIndex]?.correctOptionIndex && (
          <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions[qIndex]?.correctOptionIndex?.message}</p>
        )}
      </div>
    )
  }

  if (type === 'TRUE_FALSE') {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-w-600">Select the correct answer</p>
        {(['True', 'False'] as const).map((label, oIndex) => (
          <div key={label} className="flex items-center gap-2">
            <input
              type="radio"
              name={`question-${qIndex}-correct`}
              aria-label={`Mark "${label}" as correct for question ${qIndex + 1}`}
              checked={correctOptionIndex === oIndex}
              onChange={() => setValue(`questions.${qIndex}.correctOptionIndex`, oIndex, { shouldValidate: true })}
            />
            <span className="text-sm text-w-950">{label}</span>
          </div>
        ))}
        {errors.questions?.[qIndex]?.correctOptionIndex && (
          <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions[qIndex]?.correctOptionIndex?.message}</p>
        )}
      </div>
    )
  }

  if (type === 'MATCHING') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-w-600">Matching pairs — member must match each left item to its right item</p>
        {pairFields.map((field, pIndex) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormInput
              placeholder={`Left ${pIndex + 1}`}
              aria-label={`Question ${qIndex + 1} matching pair ${pIndex + 1} left`}
              className="flex-1"
              error={errors.questions?.[qIndex]?.matchingPairs?.[pIndex]?.left?.message}
              {...register(`questions.${qIndex}.matchingPairs.${pIndex}.left` as never)}
            />
            <span className="text-xs text-w-600 shrink-0">→</span>
            <FormInput
              placeholder={`Right ${pIndex + 1}`}
              aria-label={`Question ${qIndex + 1} matching pair ${pIndex + 1} right`}
              className="flex-1"
              error={errors.questions?.[qIndex]?.matchingPairs?.[pIndex]?.right?.message}
              {...register(`questions.${qIndex}.matchingPairs.${pIndex}.right` as never)}
            />
            {pairFields.length > 2 && (
              <button type="button" onClick={() => removePair(pIndex)} aria-label={`Remove pair ${pIndex + 1}`} className="p-1 rounded text-w-600 hover:bg-red-50 dark:hover:bg-destructive/10 hover:text-red-700 dark:hover:text-destructive transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => appendPair({ left: '', right: '' } as never)}
          className="flex items-center gap-1 text-xs font-lato text-w-700 hover:text-w-950 transition-colors"
        >
          <Plus size={12} /> Add pair
        </button>
        {errors.questions?.[qIndex]?.matchingPairs?.message && (
          <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions[qIndex]?.matchingPairs?.message}</p>
        )}
      </div>
    )
  }

  // SINGLE_SELECT or MULTI_SELECT — dynamic option count
  const isMulti = type === 'MULTI_SELECT'

  const toggleMultiOption = (oIndex: number) => {
    const current = correctOptionIndices ?? []
    const next = current.includes(oIndex) ? current.filter((i) => i !== oIndex) : [...current, oIndex].sort()
    setValue(`questions.${qIndex}.correctOptionIndices`, next, { shouldValidate: true })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-w-600">{isMulti ? 'Check every correct answer' : 'Select the one correct answer'}</p>
      {optionValues.map((_, oIndex) => (
        <div key={oIndex} className="flex items-center gap-2">
          <input
            type={isMulti ? 'checkbox' : 'radio'}
            name={isMulti ? undefined : `question-${qIndex}-correct`}
            aria-label={`Mark option ${oIndex + 1} as correct for question ${qIndex + 1}`}
            checked={isMulti ? (correctOptionIndices ?? []).includes(oIndex) : correctOptionIndex === oIndex}
            onChange={() => (isMulti ? toggleMultiOption(oIndex) : setValue(`questions.${qIndex}.correctOptionIndex`, oIndex, { shouldValidate: true }))}
          />
          <FormInput
            placeholder={`Option ${oIndex + 1}`}
            aria-label={`Question ${qIndex + 1} option ${oIndex + 1}`}
            className="flex-1"
            error={errors.questions?.[qIndex]?.options?.[oIndex]?.message}
            {...register(`questions.${qIndex}.options.${oIndex}`)}
          />
          {optionValues.length > 2 && (
            <button type="button" onClick={() => removeOptionAt(oIndex)} aria-label={`Remove option ${oIndex + 1}`} className="p-1 rounded text-w-600 hover:bg-red-50 dark:hover:bg-destructive/10 hover:text-red-700 dark:hover:text-destructive transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-1 text-xs font-lato text-w-700 hover:text-w-950 transition-colors"
      >
        <Plus size={12} /> Add option
      </button>
      {errors.questions?.[qIndex]?.options?.message && <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions[qIndex]?.options?.message}</p>}
      {isMulti && errors.questions?.[qIndex]?.correctOptionIndices?.message && (
        <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions[qIndex]?.correctOptionIndices?.message}</p>
      )}
      {!isMulti && errors.questions?.[qIndex]?.correctOptionIndex?.message && (
        <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions[qIndex]?.correctOptionIndex?.message}</p>
      )}
    </div>
  )
}
