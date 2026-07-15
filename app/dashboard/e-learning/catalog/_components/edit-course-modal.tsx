'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import {
  courseSchema,
  courseCategories,
  courseLanguages,
  courseStatuses,
  languageLabels,
  type CourseFormData,
} from '../../add/_components/course-form-schema'
import { updateCourseInCatalog } from '../../_shared/use-course-catalog'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import type { CourseCatalogEntry } from './catalog-config'

interface EditCourseModalProps {
  course: CourseCatalogEntry | null
  onClose: () => void
}

/** Edit modal for an existing catalog course — reuses the Add-Course schema/fields. */
export function EditCourseModal({ course, onClose }: EditCourseModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({ resolver: zodResolver(courseSchema) })

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        description: course.description,
        category: course.category,
        language: course.language,
        status: course.status,
        lecturerId: course.lecturerId ?? '',
      })
    }
  }, [course, reset])

  const onSubmit = (data: CourseFormData) => {
    if (!course) return
    try {
      updateCourseInCatalog(course.id, { ...data, lecturerId: data.lecturerId || undefined })
      onClose()
    } catch {
      // Update is a synchronous in-memory write; failures aren't expected here.
    }
  }

  return (
    <Modal open={!!course} onClose={onClose} title="Edit Course" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              errors.description ? 'border-red-500 bg-red-50' : 'border-w-500 bg-form-bg focus:bg-form-highlight focus:border-w-600'
            }`}
            {...register('description')}
          />
          {errors.description && <p className="text-red-600 text-xs mt-1 font-lato">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="edit-category" required>Category</FieldLabel>
            <select
              id="edit-category"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('category')}
            >
              {courseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="edit-language" required>Language</FieldLabel>
            <select
              id="edit-language"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('language')}
            >
              {courseLanguages.map((l) => <option key={l} value={l}>{languageLabels[l]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="edit-status" required>Status</FieldLabel>
          <select
            id="edit-status"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register('status')}
          >
            {courseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="edit-lecturerId">Instructor</FieldLabel>
          <select
            id="edit-lecturerId"
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
            {...register('lecturerId')}
          >
            <option value="">No assigned instructor</option>
            {lecturerRoster.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="submit" variant="primary">Save Changes</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
