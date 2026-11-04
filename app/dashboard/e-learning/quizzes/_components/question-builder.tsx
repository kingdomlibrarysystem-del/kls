'use client'

import { useFieldArray, useWatch, type Control, type UseFormRegister, type UseFormSetValue, type FieldErrors } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { createEmptyQuestion, type QuizFormData } from './quiz-form-schema'
import { QuestionAnswerFields } from './question-answer-fields'

/** Upper bound only to keep the form from rendering an unbounded number of rows. */
const MAX_QUESTIONS = 50

interface QuestionBuilderProps {
  control: Control<QuizFormData>
  register: UseFormRegister<QuizFormData>
  setValue: UseFormSetValue<QuizFormData>
  errors: FieldErrors<QuizFormData>
}

/**
 * Dynamic question builder shared by Add and Edit quiz/exam forms. Each
 * question picks a type (single-select, multi-select, open-ended); the
 * answer-input area below the text/context fields switches shape per type
 * via `QuestionAnswerFields`. Open-ended questions intentionally have no
 * correct-answer input — they aren't auto-gradeable yet (Phase B).
 */
export function QuestionBuilder({ control, register, setValue, errors }: QuestionBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })
  const watchedQuestions = useWatch({ control, name: 'questions' })

  /**
   * Resizes the question list to an exact number, so an author can set
   * "8 questions" up front instead of clicking "Add Question" eight times.
   * Removing always trims from the end so already-typed questions are kept.
   */
  const handleCountChange = (nextCount: number) => {
    if (!Number.isFinite(nextCount)) return
    const bounded = Math.max(1, Math.min(MAX_QUESTIONS, Math.floor(nextCount)))
    if (bounded > fields.length) {
      append(Array.from({ length: bounded - fields.length }, () => createEmptyQuestion()))
    } else if (bounded < fields.length) {
      remove(Array.from({ length: fields.length - bounded }, (_, i) => fields.length - 1 - i))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <FieldLabel htmlFor="questions-list">Questions</FieldLabel>
        <div className="w-36">
          <FieldLabel htmlFor="question-count">Number of questions</FieldLabel>
          <FormInput
            id="question-count"
            type="number"
            min={1}
            max={MAX_QUESTIONS}
            value={fields.length}
            onChange={(e) => handleCountChange(Number(e.target.value))}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Number of questions"
          />
        </div>
      </div>
      {fields.map((field, qIndex) => (
        <div key={field.id} className="border border-w-300 rounded p-3 space-y-2 bg-w-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-w-950">Question {qIndex + 1}</span>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(qIndex)} aria-label={`Remove question ${qIndex + 1}`} className="p-1 rounded text-w-600 hover:bg-red-50 dark:hover:bg-destructive/10 hover:text-red-700 dark:hover:text-destructive transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <div>
            <FieldLabel htmlFor={`question-${qIndex}-type`}>Question type</FieldLabel>
            <select
              id={`question-${qIndex}-type`}
              className="w-full px-3 py-2 font-lato text-xs border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
              {...register(`questions.${qIndex}.type`)}
            >
              <option value="SINGLE_SELECT">Single-select (MCQ)</option>
              <option value="MULTI_SELECT">Multi-select</option>
              <option value="YES_NO">Yes / No</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="MATCHING">Matching</option>
              <option value="OPEN">Open-ended</option>
            </select>
          </div>

          <div>
            <FieldLabel htmlFor={`question-${qIndex}-context`}>Scenario / context (optional)</FieldLabel>
            <textarea
              id={`question-${qIndex}-context`}
              rows={2}
              placeholder="Longer prompt or scenario shown above the question — leave blank for a plain question"
              aria-label={`Question ${qIndex + 1} scenario context`}
              className="w-full px-3 py-2 font-lato text-xs border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none resize-vertical"
              {...register(`questions.${qIndex}.context`)}
            />
          </div>

          <FormInput
            placeholder="Question text"
            aria-label={`Question ${qIndex + 1} text`}
            error={errors.questions?.[qIndex]?.text?.message}
            {...register(`questions.${qIndex}.text`)}
          />

          <QuestionAnswerFields
            qIndex={qIndex}
            type={watchedQuestions?.[qIndex]?.type ?? 'SINGLE_SELECT'}
            options={watchedQuestions?.[qIndex]?.options}
            correctOptionIndex={watchedQuestions?.[qIndex]?.correctOptionIndex}
            correctOptionIndices={watchedQuestions?.[qIndex]?.correctOptionIndices}
            register={register}
            setValue={setValue}
            errors={errors}
            control={control}
          />

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
        onClick={() => append(createEmptyQuestion())}
        aria-label="Add another question"
        className="flex items-center gap-1.5 text-xs font-lato font-semibold text-w-700 hover:text-w-950 transition-colors"
      >
        <Plus size={13} /> Add Question
      </button>
      {errors.questions?.message && <p className="text-red-600 dark:text-destructive text-xs font-lato">{errors.questions.message}</p>}
    </div>
  )
}
