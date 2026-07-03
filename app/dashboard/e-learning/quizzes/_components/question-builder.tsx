'use client'

import { useFieldArray, useWatch, type Control, type UseFormRegister, type UseFormSetValue, type FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { emptyQuestion, type QuizFormData } from './quiz-form-schema'

interface QuestionBuilderProps {
  control: Control<QuizFormData>
  register: UseFormRegister<QuizFormData>
  setValue: UseFormSetValue<QuizFormData>
  errors: FieldErrors<QuizFormData>
}

/**
 * Dynamic MCQ question builder shared by Add and Edit quiz/exam forms —
 * at minimum question text + answer options per assessment-data.ts's shape.
 * Open-ended questions aren't supported by this builder yet; only MCQ,
 * which is the format this task's minimum bar calls for.
 */
export function QuestionBuilder({ control, register, setValue, errors }: QuestionBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })
  const watchedQuestions = useWatch({ control, name: 'questions' })

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    setValue(`questions.${qIndex}.correctOptionIndex`, oIndex, { shouldValidate: true })
  }

  return (
    <div className="space-y-3">
      <FieldLabel htmlFor="questions-list">Questions</FieldLabel>
      {fields.map((field, qIndex) => (
        <div key={field.id} className="border border-w-300 rounded p-3 space-y-2 bg-w-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-w-950">Question {qIndex + 1}</span>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(qIndex)} aria-label={`Remove question ${qIndex + 1}`} className="p-1 rounded text-w-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <FormInput
            placeholder="Question text"
            aria-label={`Question ${qIndex + 1} text`}
            error={errors.questions?.[qIndex]?.text?.message}
            {...register(`questions.${qIndex}.text`)}
          />

          <div className="space-y-1.5">
            {[0, 1, 2, 3].map((oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`question-${qIndex}-correct`}
                  aria-label={`Mark option ${oIndex + 1} as correct for question ${qIndex + 1}`}
                  checked={watchedQuestions?.[qIndex]?.correctOptionIndex === oIndex}
                  onChange={() => setCorrectOption(qIndex, oIndex)}
                />
                <FormInput
                  placeholder={`Option ${oIndex + 1}${oIndex >= 2 ? ' (optional)' : ''}`}
                  aria-label={`Question ${qIndex + 1} option ${oIndex + 1}`}
                  className="flex-1"
                  {...register(`questions.${qIndex}.options.${oIndex}`)}
                />
              </div>
            ))}
          </div>
          {errors.questions?.[qIndex]?.options && <p className="text-red-600 text-xs font-lato">{errors.questions[qIndex]?.options?.message}</p>}

          <div className="w-32">
            <FieldLabel htmlFor={`question-${qIndex}-marks`}>Marks</FieldLabel>
            <FormInput
              id={`question-${qIndex}-marks`}
              type="number"
              min={1}
              error={errors.questions?.[qIndex]?.marks?.message}
              {...register(`questions.${qIndex}.marks`, { valueAsNumber: true })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append(emptyQuestion)}
        aria-label="Add another question"
        className="flex items-center gap-1.5 text-xs font-lato font-semibold text-w-700 hover:text-w-950 transition-colors"
      >
        <Plus size={13} /> Add Question
      </button>
      {errors.questions?.root && <p className="text-red-600 text-xs font-lato">{errors.questions.root.message}</p>}
    </div>
  )
}
