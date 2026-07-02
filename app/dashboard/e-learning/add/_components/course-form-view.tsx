'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { addCourseToCatalog } from '../../_shared/use-course-catalog'
import {
  courseSchema,
  courseCategories,
  courseLanguages,
  courseStatuses,
  languageLabels,
  type CourseFormData,
} from './course-form-schema'

/**
 * Add/Edit Course form. On submit, appends the new course to the shared
 * `/dashboard/e-learning/*` course catalog store so it immediately appears
 * in the Course Catalog list and becomes available to Enrollments.
 */
export function CourseFormView() {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { language: 'en', status: 'DRAFT' },
  })

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (!data.title.trim()) throw new Error('Title cannot be empty')
      addCourseToCatalog({
        title: data.title,
        description: data.description,
        category: data.category,
        language: data.language,
        status: data.status,
      })
      setSubmitSuccess(true)
      reset({ title: '', description: '', category: '', language: 'en', status: 'DRAFT' })
      setTimeout(() => setSubmitSuccess(false), 3500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <FormSection title="Course Details">
        <form onSubmit={handleSubmit(onSubmit)}>
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
            <FieldLabel htmlFor="title" required>Course Title</FieldLabel>
            <FormInput id="title" type="text" placeholder="e.g. Foundations of Faith" error={errors.title?.message} {...register('title')} />
          </div>

          <div>
            <FieldLabel htmlFor="description" required>Description</FieldLabel>
            <textarea
              id="description"
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
              <FieldLabel htmlFor="category" required>Category</FieldLabel>
              <select
                id="category"
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
                {...register('category')}
              >
                <option value="">Select category…</option>
                {courseCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p className="text-red-600 text-xs mt-1 font-lato">{errors.category.message}</p>}
            </div>

            <div>
              <FieldLabel htmlFor="language" required>Language</FieldLabel>
              <select
                id="language"
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
                {...register('language')}
              >
                {courseLanguages.map((l) => <option key={l} value={l}>{languageLabels[l]}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="coverImage">Cover Image</FieldLabel>
              <label
                htmlFor="coverImage"
                className="flex items-center gap-2 px-4 py-3 font-lato text-sm border border-dashed border-w-400 bg-form-bg rounded cursor-pointer text-w-700 hover:border-w-600 transition-colors"
              >
                <UploadCloud size={16} /> Choose file…
                <input id="coverImage" type="file" accept="image/*" className="hidden" aria-label="Upload cover image" />
              </label>
            </div>

            <div>
              <FieldLabel htmlFor="status" required>Status</FieldLabel>
              <select
                id="status"
                className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
                {...register('status')}
              >
                {courseStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <ElegantButton type="submit" loading={submitting} variant="primary">
            Save Course
          </ElegantButton>
        </form>
      </FormSection>
    </div>
  )
}
