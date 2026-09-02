'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCourseCatalog } from '../../_shared/use-course-catalog'
import { addAssessment } from '@/app/member/_shared/use-assessments'
import { quizFormSchema, emptyQuestion, type QuizFormData } from './quiz-form-schema'
import { QuestionBuilder } from './question-builder'
import { ProjectFields } from './project-fields'

interface AddQuizModalProps {
  open: boolean
  onClose: () => void
}

/** Create modal for a new quiz/exam, including a question builder — appends to the real Assessment collection. */
export function AddQuizModal({ open, onClose }: AddQuizModalProps) {
  const { data: courseCatalog } = useCourseCatalog()
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { courseId: courseCatalog[0]?.id ?? '', kind: 'QUIZ', questions: [emptyQuestion] },
  })

  const kind = watch('kind')

  // The modal body scrolls independently (Modal's overflow-y-auto panel),
  // and this form can run several screens tall once a few questions exist
  // — a validation failure on a question above the current scroll position
  // previously gave no visible feedback at all (the error text rendered
  // off-screen, and native focus-triggered scrolling doesn't reliably
  // reach into a nested scroll container), which looked exactly like the
  // submit button silently doing nothing. Scrolling the first invalid
  // field into view makes the failure visible.
  const onInvalid = () => {
    requestAnimationFrame(() => {
      const target = document.querySelector('form .border-red-500, form .text-red-600')
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const onSubmit = async (data: QuizFormData) => {
    try {
      await addAssessment({
        title: data.title,
        courseId: data.courseId,
        kind: data.kind,
        durationSeconds: data.kind === 'EXAM' && data.durationMinutes ? data.durationMinutes * 60 : undefined,
        questions: data.kind === 'PROJECT' ? [] : data.questions.map((q, i) => ({
          id: `q${i + 1}`,
          text: q.text,
          type: q.type,
          context: q.context?.trim() ? q.context : undefined,
          options: q.type === 'OPEN' ? undefined : q.options?.filter((o) => o.trim().length > 0),
          correctOptionIndex: q.type === 'SINGLE_SELECT' ? q.correctOptionIndex : undefined,
          correctOptionIndices: q.type === 'MULTI_SELECT' ? q.correctOptionIndices : undefined,
          marks: q.marks,
        })),
        brief: data.kind === 'PROJECT' ? data.brief : undefined,
        submissionFormat: data.kind === 'PROJECT' ? data.submissionFormat : undefined,
        projectMarks: data.kind === 'PROJECT' ? data.projectMarks : undefined,
      })
      reset({ courseId: courseCatalog[0]?.id ?? '', kind: 'QUIZ', title: '', questions: [emptyQuestion] })
      onClose()
    } catch {
      // Real error surfaced via the assessment hook's own error state on next load.
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Quiz / Exam" size="lg">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="add-quiz-title" required>Title</FieldLabel>
          <FormInput id="add-quiz-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="add-quiz-course" required>Course</FieldLabel>
            <select id="add-quiz-course" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('courseId')}>
              {courseCatalog.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="add-quiz-kind" required>Type</FieldLabel>
            <select id="add-quiz-kind" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('kind')}>
              <option value="QUIZ">Quiz</option>
              <option value="EXAM">Exam</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
          {kind === 'EXAM' && (
            <div>
              <FieldLabel htmlFor="add-quiz-duration" required>Time Limit (min)</FieldLabel>
              <FormInput id="add-quiz-duration" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
            </div>
          )}
        </div>

        {kind === 'PROJECT' ? (
          <ProjectFields register={register} errors={errors} />
        ) : (
          <QuestionBuilder control={control} register={register} setValue={setValue} errors={errors} />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" variant="primary">Add Quiz / Exam</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
