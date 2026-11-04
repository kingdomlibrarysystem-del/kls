'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import {
  courseSchema,
  courseLanguages,
  courseStatuses,
  languageLabels,
  type CourseFormData,
} from '../../add/_components/course-form-schema'
import { updateCourseInCatalog } from '../../_shared/use-course-catalog'
import { useCourseCategories } from '../../_shared/use-course-categories'
import { useUsers } from '@/app/dashboard/users/_components/use-users'
import type { CourseCatalogEntry } from './catalog-config'

interface EditCourseModalProps {
  course: CourseCatalogEntry | null
  onClose: () => void
}

/** Edit modal for an existing catalog course — reuses the Add-Course schema/fields. */
export function EditCourseModal({ course, onClose }: EditCourseModalProps) {
  const { users } = useUsers()
  const { data: courseCategories } = useCourseCategories()
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({ resolver: zodResolver(courseSchema) })

  const coverImage = watch('image') ?? ''

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        description: course.description,
        category: course.category,
        language: course.language,
        status: course.status,
        lecturerId: course.lecturerId ?? '',
        image: course.image ?? '',
      })
      setSubmitError('')
    }
  }, [course, reset])

  const onSubmit = async (data: CourseFormData) => {
    if (!course) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await updateCourseInCatalog(course.id, { ...data, lecturerId: data.lecturerId || undefined, image: data.image || undefined })
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={!!course} onClose={onClose} title="Edit Course" size="3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-destructive/10 border border-red-200 dark:border-destructive/30 text-red-700 dark:text-destructive px-4 py-3 rounded font-lato text-sm">
            <AlertCircle size={15} /> {submitError}
          </div>
        )}
        <div>
          <FieldLabel htmlFor="edit-title" required>Course Title</FieldLabel>
          <FormInput id="edit-title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="edit-description" required>Description</FieldLabel>
          <textarea
            id="edit-description"
            rows={4}
            className={`w-full px-4 py-3 font-lato text-sm border rounded transition-colors focus:outline-none ${
              errors.description ? 'border-red-500 bg-red-50' : 'border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 focus:bg-form-highlight dark:focus:bg-white/10 focus:border-w-600 dark:focus:border-primary'
            }`}
            {...register('description')}
          />
          {errors.description && <p className="text-red-600 dark:text-destructive text-xs mt-1 font-lato">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="edit-category" required>Category</FieldLabel>
            <select
              id="edit-category"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
              {...register('category')}
            >
              {courseCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="edit-language" required>Language</FieldLabel>
            <select
              id="edit-language"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
              {...register('language')}
            >
              {courseLanguages.map((l) => <option key={l} value={l}>{languageLabels[l]}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="edit-coverImage">Cover Image</FieldLabel>
            <CloudinaryUploadField
              id="edit-coverImage"
              accept="image/*"
              label="Upload cover image"
              kind="image"
              value={coverImage}
              onUploaded={(result) => setValue('image', result.url)}
              onClear={() => setValue('image', '')}
            />
          </div>
          <div>
            <FieldLabel htmlFor="edit-status" required>Status</FieldLabel>
            <select
              id="edit-status"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
              {...register('status')}
            >
              {courseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="edit-lecturerId">Instructor</FieldLabel>
          <select
            id="edit-lecturerId"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 dark:border-white/15 bg-form-bg dark:bg-white/5 rounded focus:border-w-600 dark:focus:border-primary focus:outline-none"
            {...register('lecturerId')}
          >
            <option value="">No assigned instructor</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
