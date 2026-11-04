'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { updateLesson } from '@/app/member/_shared/use-lessons'
import { contentTypeLabels } from './lesson-form-schema'
import { LessonMediaUpload } from './lesson-media-upload'
import type { LessonRow } from './lessons-config'

const editSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  contentType: z.enum(['TEXT', 'VIDEO', 'FILE']),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  order: z.number().int().min(1, 'Order must be at least 1'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
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
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) })

  useEffect(() => {
    if (lesson) {
      reset({ title: lesson.title, contentType: lesson.contentType, durationMinutes: lesson.durationMinutes, order: lesson.order, status: lesson.status, content: lesson.content, contentMarkdown: lesson.contentMarkdown ?? '' })
      setSubmitError('')
    }
  }, [lesson, reset])

  const onSubmit = async (data: EditFormData) => {
    if (!lesson) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await updateLesson(lesson.courseId, lesson.lessonId, data)
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={!!lesson} onClose={onClose} title="Edit Lesson" size="5xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-destructive/10 border border-red-200 dark:border-destructive/30 text-red-700 dark:text-destructive px-4 py-3 rounded font-lato text-sm">
            <AlertCircle size={15} /> {submitError}
          </div>
        )}
        <div>
          <FieldLabel htmlFor="edit-lesson-title" required>Lesson Title</FieldLabel>
          <FormInput id="edit-lesson-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="edit-lesson-type" required>Content Type</FieldLabel>
            <select id="edit-lesson-type" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('contentType')}>
              {(Object.keys(contentTypeLabels) as (keyof typeof contentTypeLabels)[]).map((t) => (
                <option key={t} value={t}>{contentTypeLabels[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="edit-lesson-duration" required>Duration (minutes)</FieldLabel>
            <FormInput id="edit-lesson-duration" type="number" min={1} error={errors.durationMinutes?.message} {...register('durationMinutes', { valueAsNumber: true })} />
          </div>
          <div>
            <FieldLabel htmlFor="edit-lesson-order" required>Order</FieldLabel>
            <FormInput id="edit-lesson-order" type="number" min={1} error={errors.order?.message} {...register('order', { valueAsNumber: true })} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="edit-lesson-status" required>Status</FieldLabel>
          <select id="edit-lesson-status" className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none" {...register('status')}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="edit-lesson-content" required>Summary</FieldLabel>
          <textarea
            id="edit-lesson-content"
            rows={2}
            className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
              errors.content ? 'border-red-500 bg-red-50' : 'border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 focus:bg-form-highlight dark:focus:bg-white/10 focus:border-w-600 dark:focus:border-primary'
            }`}
            {...register('content')}
          />
          {errors.content && <p className="text-red-600 dark:text-destructive text-xs mt-1 font-lato">{errors.content.message}</p>}
        </div>

        <LessonMediaUpload
          contentType={watch('contentType')}
          onInsert={(markdownToAppend) =>
            setValue('contentMarkdown', `${getValues('contentMarkdown') ?? ''}${markdownToAppend}`, { shouldValidate: true })
          }
        />

        <div>
          <FieldLabel htmlFor="edit-lesson-markdown" required>Lesson Content</FieldLabel>
          <Controller
            name="contentMarkdown"
            control={control}
            render={({ field }) => <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} />}
          />
          {errors.contentMarkdown && <p className="text-red-600 dark:text-destructive text-xs mt-1 font-lato">{errors.contentMarkdown.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
