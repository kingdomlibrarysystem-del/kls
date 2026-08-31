'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { useAuth } from '@/contexts/auth-context'
import { addCourseToCatalog } from '../../_shared/use-course-catalog'
import { useUsers } from '@/app/dashboard/users/_components/use-users'
import {
  courseSchema,
  courseLanguages,
  courseStatuses,
  languageLabels,
  type CourseFormData,
} from '../../add/_components/course-form-schema'
import { useCourseCategories } from '../../_shared/use-course-categories'

interface AddCourseModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Add Course, presented as a modal on the Course Catalog page (instead of a
 * standalone route). On submit, appends the new course to the shared
 * `/dashboard/e-learning/*` catalog store so it immediately appears in the
 * list underneath, then closes the modal. Resets its form whenever it's
 * reopened so a fresh, blank form is shown each time.
 */
export function AddCourseModal({ open, onClose }: AddCourseModalProps) {
  const { user } = useAuth()
  const { users } = useUsers()
  const { data: courseCategories } = useCourseCategories()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { language: 'en', status: 'DRAFT', image: '' },
  })
  const coverImage = watch('image') ?? ''

  useEffect(() => {
    if (open) {
      reset({ title: '', description: '', category: '', language: 'en', status: 'DRAFT', lecturerId: '', image: '' })
      setSubmitError('')
      setSubmitSuccess(false)
    }
  }, [open, reset])

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)
    try {
      if (!data.title.trim()) throw new Error('Title cannot be empty')
      const authorName = user ? `${user.firstName} ${user.lastName}`.trim() : undefined
      await addCourseToCatalog({
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        status: data.status,
        author: authorName || 'Kingdom Library System',
        lecturerId: data.lecturerId || undefined,
        image: data.image || undefined,
      })
      setSubmitSuccess(true)
      setTimeout(onClose, 800)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    if (submitting) return
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Add Course" size="3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 font-lato text-sm">
            <CheckCircle2 size={15} /> Course added to the catalog.
          </div>
        )}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 font-lato text-sm">
            <AlertCircle size={15} /> {submitError}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="add-title" required>Course Title</FieldLabel>
          <FormInput id="add-title" type="text" placeholder="e.g. Foundations of Faith" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="add-description" required>Description</FieldLabel>
          <textarea
            id="add-description"
            rows={4}
            placeholder="What will students learn in this course?"
            className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
            }`}
            {...register('description')}
          />
          {errors.description && <p className="text-red-600 text-xs mt-1 font-lato">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="add-category" required>Category</FieldLabel>
            <select
              id="add-category"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('category')}
            >
              <option value="">Select category…</option>
              {courseCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            {errors.category && <p className="text-red-600 text-xs mt-1 font-lato">{errors.category.message}</p>}
          </div>

          <div>
            <FieldLabel htmlFor="add-language" required>Language</FieldLabel>
            <select
              id="add-language"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('language')}
            >
              {courseLanguages.map((l) => <option key={l} value={l}>{languageLabels[l]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="add-coverImage">Cover Image</FieldLabel>
            <CloudinaryUploadField
              id="add-coverImage"
              accept="image/*"
              label="Upload cover image"
              kind="image"
              value={coverImage}
              onUploaded={(result) => setValue('image', result.url)}
              onClear={() => setValue('image', '')}
            />
          </div>

          <div>
            <FieldLabel htmlFor="add-status" required>Status</FieldLabel>
            <select
              id="add-status"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('status')}
            >
              {courseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="add-lecturerId">Instructor</FieldLabel>
          <select
            id="add-lecturerId"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register('lecturerId')}
          >
            <option value="">No assigned instructor</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">Add Course</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
