'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCourseCatalog } from '../../_shared/use-course-catalog'
import { useLessonsByCourse } from '@/app/member/_shared/use-lessons'
import { updateAssessment } from '@/app/member/_shared/use-assessments'
import { quizFormSchema, type QuizFormData } from './quiz-form-schema'
import { QuestionBuilder } from './question-builder'
import { ProjectFields } from './project-fields'
import type { TakeableAssessment } from './quizzes-config'

interface EditQuizModalProps {
  assessment: TakeableAssessment | null
  onClose: () => void
}

/** Edit modal for an existing quiz/exam, reusing the same question builder as Add. */
export function EditQuizModal({ assessment, onClose }: EditQuizModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { data: courseCatalog } = useCourseCatalog()
  const { data: lessonsByCourse } = useLessonsByCourse()
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuizFormData>({ resolver: zodResolver(quizFormSchema) })

  const kind = watch('kind')
  const courseId = watch('courseId')
  const courseLessons = lessonsByCourse[courseId]?.lessons ?? []

  useEffect(() => {
    if (assessment) {
      reset({
        title: assessment.title,
        courseId: assessment.courseId,
        kind: assessment.kind,
        lessonId: assessment.lessonId,
        durationMinutes: assessment.durationSeconds ? Math.round(assessment.durationSeconds / 60) : undefined,
        questions: assessment.questions.map((q) => ({
          type: q.type,
          text: q.text,
          context: q.context ?? '',
          options: q.options && q.options.length > 0 ? q.options : ['', ''],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          correctOptionIndices: q.correctOptionIndices ?? [],
          matchingPairs: q.matchingPairs && q.matchingPairs.length > 0 ? q.matchingPairs : [{ left: '', right: '' }, { left: '', right: '' }],
          marks: q.marks,
        })),
        brief: assessment.brief ?? '',
        submissionFormat: assessment.submissionFormat,
        projectMarks: assessment.projectMarks,
      })
    }
  }, [assessment, reset])

  // See AddQuizModal's onInvalid for why this is needed â€” the modal body
  // scrolls independently, so a validation failure on a question above
  // the current scroll position gave no visible feedback at all.
  const onInvalid = () => {
    requestAnimationFrame(() => {
      const target = document.querySelector('form [aria-invalid="true"], form .text-destructive')
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const onSubmit = async (data: QuizFormData) => {
    if (!assessment) return
    setSubmitError(null)
    try {
      await updateAssessment(assessment.id, {
        title: data.title,
        courseId: data.courseId,
        kind: data.kind,
        lessonId: data.kind === 'TEST' ? data.lessonId : undefined,
        durationSeconds: data.kind === 'EXAM' && data.durationMinutes ? data.durationMinutes * 60 : undefined,
        questions: data.kind === 'PROJECT' ? [] : data.questions.map((q, i) => ({
          id: assessment.questions[i]?.id ?? `q${i + 1}`,
          text: q.text,
          type: q.type,
          context: q.context?.trim() ? q.context : undefined,
          options: (q.type === 'OPEN' || q.type === 'YES_NO' || q.type === 'TRUE_FALSE' || q.type === 'MATCHING') ? undefined : q.options?.filter((o) => o.trim().length > 0),
          correctOptionIndex: (q.type === 'SINGLE_SELECT' || q.type === 'YES_NO' || q.type === 'TRUE_FALSE') ? q.correctOptionIndex : undefined,
          correctOptionIndices: q.type === 'MULTI_SELECT' ? q.correctOptionIndices : undefined,
          matchingPairs: q.type === 'MATCHING' ? q.matchingPairs : undefined,
          marks: q.marks,
        })),
        brief: data.kind === 'PROJECT' ? data.brief : undefined,
        submissionFormat: data.kind === 'PROJECT' ? data.submissionFormat : undefined,
        projectMarks: data.kind === 'PROJECT' ? data.projectMarks : undefined,
      })
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save assessment')
    }
  }

  return (
    <Modal open={!!assessment} onClose={onClose} title="Edit Assessment" size="lg">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="edit-quiz-title" required>Title</FieldLabel>
          <FormInput id="edit-quiz-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="edit-quiz-course" required>Course</FieldLabel>
            <select id="edit-quiz-course" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('courseId')}>
              {courseCatalog.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="edit-quiz-kind" required>Type</FieldLabel>
            <select id="edit-quiz-kind" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('kind')}>
              <option value="TEST">Test (per-lesson)</option>
              <option value="QUIZ">Quiz (mid-course)</option>
              <option value="EXAM">Exam (end-of-course)</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
          {kind === 'EXAM' && (
            <div>
              <FieldLabel htmlFor="edit-quiz-duration" required>Time Limit (min)</FieldLabel>
              <FormInput id="edit-quiz-duration" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
            </div>
          )}
          {kind === 'TEST' && (
            <div>
              <FieldLabel htmlFor="edit-quiz-lesson" required>Lesson</FieldLabel>
              <select id="edit-quiz-lesson" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('lessonId')}>
                <option value="" disabled>Select a lesson</option>
                {courseLessons.map((l, i) => <option key={l.id} value={l.id}>{i + 1}. {l.title}</option>)}
              </select>
              {errors.lessonId?.message && <p className="text-red-600 dark:text-destructive text-xs font-lato mt-1">{errors.lessonId.message}</p>}
              {courseLessons.length === 0 && (
                <p className="text-xs text-w-600 font-lato mt-1">This course has no lessons yet â€” add one first.</p>
              )}
            </div>
          )}
        </div>

        {kind === 'PROJECT' ? (
          <ProjectFields register={register} errors={errors} />
        ) : (
          <QuestionBuilder control={control} register={register} setValue={setValue} errors={errors} />
        )}

        {submitError && (
          <p className="text-red-600 dark:text-destructive text-sm font-lato" role="alert">{submitError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}

