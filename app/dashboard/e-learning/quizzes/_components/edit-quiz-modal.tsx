'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCourseCatalog } from '../../_shared/use-course-catalog'
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
  const { data: courseCatalog } = useCourseCatalog()
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

  useEffect(() => {
    if (assessment) {
      reset({
        title: assessment.title,
        courseId: assessment.courseId,
        kind: assessment.kind,
        durationMinutes: assessment.durationSeconds ? Math.round(assessment.durationSeconds / 60) : undefined,
        questions: assessment.questions.map((q) => ({
          type: q.type,
          text: q.text,
          context: q.context ?? '',
          options: q.options && q.options.length > 0 ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
          correctOptionIndex: q.correctOptionIndex ?? 0,
          correctOptionIndices: q.correctOptionIndices ?? [],
          marks: q.marks,
        })),
        brief: assessment.brief ?? '',
        submissionFormat: assessment.submissionFormat,
        projectMarks: assessment.projectMarks,
      })
    }
  }, [assessment, reset])

  const onSubmit = async (data: QuizFormData) => {
    if (!assessment) return
    try {
      await updateAssessment(assessment.id, {
        title: data.title,
        courseId: data.courseId,
        kind: data.kind,
        durationSeconds: data.kind === 'EXAM' && data.durationMinutes ? data.durationMinutes * 60 : undefined,
        questions: data.kind === 'PROJECT' ? [] : data.questions.map((q, i) => ({
          id: assessment.questions[i]?.id ?? `q${i + 1}`,
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
      onClose()
    } catch {
      // Real error surfaced via the assessment hook's own error state on next load.
    }
  }

  return (
    <Modal open={!!assessment} onClose={onClose} title="Edit Quiz / Exam" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="edit-quiz-title" required>Title</FieldLabel>
          <FormInput id="edit-quiz-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="edit-quiz-course" required>Course</FieldLabel>
            <select id="edit-quiz-course" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('courseId')}>
              {courseCatalog.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="edit-quiz-kind" required>Type</FieldLabel>
            <select id="edit-quiz-kind" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('kind')}>
              <option value="QUIZ">Quiz</option>
              <option value="EXAM">Exam</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>
          {kind === 'EXAM' && (
            <div>
              <FieldLabel htmlFor="edit-quiz-duration" required>Time Limit (min)</FieldLabel>
              <FormInput id="edit-quiz-duration" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
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
          <ElegantButton type="submit" variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
