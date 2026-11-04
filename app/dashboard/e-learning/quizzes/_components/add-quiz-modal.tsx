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
import { addAssessment } from '@/app/member/_shared/use-assessments'
import { quizFormSchema, createEmptyQuestion, type QuizFormData } from './quiz-form-schema'
import { QuestionBuilder } from './question-builder'
import { ProjectFields } from './project-fields'

interface AddQuizModalProps {
  open: boolean
  onClose: () => void
}

/** Create modal for a new quiz/exam, including a question builder â€” appends to the real Assessment collection. */
export function AddQuizModal({ open, onClose }: AddQuizModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { data: courseCatalog } = useCourseCatalog()
  const { data: lessonsByCourse } = useLessonsByCourse()
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { courseId: courseCatalog[0]?.id ?? '', kind: 'QUIZ', lessonId: undefined, questions: [createEmptyQuestion()] },
  })

  const kind = watch('kind')
  const courseId = watch('courseId')
  const courseLessons = lessonsByCourse[courseId]?.lessons ?? []

  // The course catalog loads client-side, so it is usually still empty when
  // this form mounts (defaultValues then has courseId ''). Without this the
  // select shows the first course but the form value stays '' and submit
  // fails validation with no visible message near the select.
  useEffect(() => {
    if (courseCatalog.length > 0 && !getValues('courseId')) {
      setValue('courseId', courseCatalog[0].id)
    }
  }, [courseCatalog, getValues, setValue])



  // The modal body scrolls independently (Modal's overflow-y-auto panel),
  // and this form can run several screens tall once a few questions exist
  // â€” a validation failure on a question above the current scroll position
  // previously gave no visible feedback at all (the error text rendered
  // off-screen, and native focus-triggered scrolling doesn't reliably
  // reach into a nested scroll container), which looked exactly like the
  // submit button silently doing nothing. Scrolling the first invalid
  // field into view makes the failure visible.
  const onInvalid = () => {
    requestAnimationFrame(() => {
      const target = document.querySelector('form [aria-invalid="true"], form .text-destructive')
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const onSubmit = async (data: QuizFormData) => {
    setSubmitError(null)
    try {
      await addAssessment({
        title: data.title,
        courseId: data.courseId,
        kind: data.kind,
        lessonId: data.kind === 'TEST' ? data.lessonId : undefined,
        durationSeconds: data.kind === 'EXAM' && data.durationMinutes ? data.durationMinutes * 60 : undefined,
        questions: data.kind === 'PROJECT' ? [] : data.questions.map((q, i) => ({
          id: `q${i + 1}`,
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
      reset({ courseId: courseCatalog[0]?.id ?? '', kind: 'QUIZ', lessonId: undefined, title: '', questions: [createEmptyQuestion()] })
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create assessment')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Test / Quiz / Exam" size="lg">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="add-quiz-title" required>Title</FieldLabel>
          <FormInput id="add-quiz-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="add-quiz-course" required>Course</FieldLabel>
            <select id="add-quiz-course" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('courseId', { onChange: () => setValue('lessonId', undefined) })}>
              {courseCatalog.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {errors.courseId?.message && <p className="text-red-600 dark:text-destructive text-xs font-lato mt-1">{errors.courseId.message}</p>}
          </div>
          <div>
            <FieldLabel htmlFor="add-quiz-kind" required>Type</FieldLabel>
            <select id="add-quiz-kind" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('kind')}>
              <option value="TEST">Test (per-lesson)</option>
              <option value="QUIZ">Quiz (mid-course)</option>
              <option value="EXAM">Exam (end-of-course)</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
          {kind === 'EXAM' && (
            <div>
              <FieldLabel htmlFor="add-quiz-duration" required>Time Limit (min)</FieldLabel>
              <FormInput id="add-quiz-duration" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
            </div>
          )}
          {kind === 'TEST' && (
            <div>
              <FieldLabel htmlFor="add-quiz-lesson" required>Lesson</FieldLabel>
              <select id="add-quiz-lesson" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('lessonId')}>
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
          <ElegantButton type="submit" variant="primary">Add Assessment</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}

