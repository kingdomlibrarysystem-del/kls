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
import { addArticle, updateArticle } from '../../_shared/use-articles'
import { articleSchema, type ArticleFormData } from './article-form-schema'
import type { NewsArticle } from '../../_shared/news-data'

interface ArticleFormModalProps {
  open: boolean
  editing: NewsArticle | null
  onClose: () => void
}

/** Create/edit modal for a NewsArticle, mirrors AddCourseModal's exact shape — both modes share one form component. */
export function ArticleFormModal({ open, editing, onClose }: ArticleFormModalProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { language: 'EN', isEdition: false, coverImage: '' },
  })
  const coverImage = watch('coverImage') ?? ''

  useEffect(() => {
    if (open) {
      reset(editing
        ? { title: editing.title, summary: editing.summary, content: editing.content, category: editing.category, coverImage: editing.coverImage ?? '', language: editing.language.toUpperCase() as 'EN' | 'FR' | 'RW', isEdition: editing.isEdition }
        : { title: '', summary: '', content: '', category: '', coverImage: '', language: 'EN', isEdition: false })
      setSubmitError('')
      setSubmitSuccess(false)
    }
  }, [open, editing, reset])

  const onSubmit = async (data: ArticleFormData) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      if (editing) {
        await updateArticle(editing.id, data)
      } else {
        if (!user) throw new Error('You must be signed in to create an article')
        await addArticle({ authorId: user.id, ...data, coverImage: data.coverImage || undefined })
      }
      setSubmitSuccess(true)
      setTimeout(onClose, 800)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save article')
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => { if (!submitting) onClose() }

  return (
    <Modal open={open} onClose={close} title={editing ? 'Edit Article' : 'New Article'} size="3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitSuccess && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm"><CheckCircle2 size={15} /> Article saved.</div>}
        {submitError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm"><AlertCircle size={15} /> {submitError}</div>}

        <div>
          <FieldLabel htmlFor="title" required>Title</FieldLabel>
          <FormInput id="title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="summary" required>Summary</FieldLabel>
          <textarea id="summary" rows={2} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" {...register('summary')} />
          {errors.summary && <p className="text-red-600 text-xs mt-1 font-lato">{errors.summary.message}</p>}
        </div>

        <div>
          <FieldLabel htmlFor="content" required>Content</FieldLabel>
          <textarea id="content" rows={6} className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none" {...register('content')} />
          {errors.content && <p className="text-red-600 text-xs mt-1 font-lato">{errors.content.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="category" required>Category</FieldLabel>
            <FormInput id="category" type="text" placeholder="e.g. Ministry Updates" error={errors.category?.message} {...register('category')} />
          </div>
          <div>
            <FieldLabel htmlFor="language" required>Language</FieldLabel>
            <select id="language" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('language')}>
              <option value="EN">English</option>
              <option value="FR">Français</option>
              <option value="RW">Kinyarwanda</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="coverImage">Cover Image</FieldLabel>
            <CloudinaryUploadField id="coverImage" accept="image/*" label="Upload cover image" kind="image" value={coverImage} onUploaded={(result) => setValue('coverImage', result.url)} onClear={() => setValue('coverImage', '')} />
          </div>
          <label className="flex items-center gap-2 font-lato text-sm text-w-950 mt-7">
            <input type="checkbox" {...register('isEdition')} />
            This is a full Edition (not a single article)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">{editing ? 'Save Changes' : 'Create Article'}</ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
