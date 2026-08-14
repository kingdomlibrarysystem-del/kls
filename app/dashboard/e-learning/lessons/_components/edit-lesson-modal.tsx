'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { updateLesson } from '@/app/member/_shared/use-lessons'
import { contentTypeLabels } from './lesson-form-schema'
import type { LessonRow } from './lessons-config'

const editSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  contentType: z.enum(['TEXT', 'VIDEO', 'FILE']),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  content: z.string().min(3, 'Content is required'),
  contentMarkdown: z.string().min(1, 'Lesson content is required'),
})

type EditFormData = z.infer<typeof editSchema>

interface EditLessonModalProps {
  lesson: LessonRow | null
  onClose: () => void
}

/** Edit modal for an existing lesson's content fields. Course/order aren't editable here — use Reorder for order. */
export function EditLessonModal({ lesson, onClose }: EditLessonModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  useEffect(() => {
    if (lesson) {
      reset({ title: lesson.title, contentType: lesson.contentType, durationMinutes: lesson.durationMinutes, content: lesson.content, contentMarkdown: lesson.contentMarkdown ?? '' })
    }
  }, [lesson, reset])

  const onSubmit = async (data: EditFormData) => {
    if (!lesson) return
    try {
      await updateLesson(lesson.courseId, lesson.lessonId, data)
      onClose()
    } catch {
      // Real error surfaced via the lessons hook's own error state on next load.
    }
  }

  return (
    <Modal open={!!lesson} onClose={onClose} title="Edit Lesson" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <FieldLabel htmlFor="edit-lesson-title" required>Lesson Title</FieldLabel>
          <FormInput id="edit-lesson-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="edit-lesson-type" required>Content Type</FieldLabel>
            <select id="edit-lesson-type" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('contentType')}>
              {(Object.keys(contentTypeLabels) as (keyof typeof contentTypeLabels)[]).map((t) => (
                <option key={t} value={t}>{contentTypeLabels[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="edit-lesson-duration" required>Duration (minutes)</FieldLabel>
            <FormInput id="edit-lesson-duration" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="edit-lesson-content" required>Summary</FieldLabel>
          <textarea
            id="edit-lesson-content"
            rows={2}
            className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
              errors.content ? 'border-red-500 bg-red-50' : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
            }`}
            {...register('content')}
          />
          {errors.content && <p className="text-red-600 text-xs mt-1 font-lato">{errors.content.message}</p>}
        </div>

        <div>
          <FieldLabel htmlFor="edit-lesson-markdown" required>Lesson Content</FieldLabel>
          <Controller
            name="contentMarkdown"
            control={control}
            render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} />}
          />
          {errors.contentMarkdown && <p className="text-red-600 text-xs mt-1 font-lato">{errors.contentMarkdown.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
