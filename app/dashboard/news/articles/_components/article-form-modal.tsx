'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { RemoteImage } from '@/components/ui/remote-image'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { useAuth } from '@/contexts/auth-context'
import { addArticle, updateArticle } from '../../_shared/use-articles'
import { articleSchema, type ArticleFormData } from './article-form-schema'
import type { NewsArticle } from '../../_shared/news-data'
import type { ParagraphAlign } from '@/components/ui/markdown-content'

interface ArticleFormModalProps {
  open: boolean
  editing: NewsArticle | null
  onClose: () => void
  /** Pre-loaded category names for the category select. */
  categories?: string[]
}

const ALIGN_OPTIONS: { value: ParagraphAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: 'left', label: 'Left', icon: AlignLeft },
  { value: 'center', label: 'Center', icon: AlignCenter },
  { value: 'right', label: 'Right', icon: AlignRight },
  { value: 'justify', label: 'Justify', icon: AlignJustify },
]

/** Create/edit modal for a NewsArticle — edit is allowed on any status. */
export function ArticleFormModal({ open, editing, onClose, categories = [] }: ArticleFormModalProps) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [coverUploaded, setCoverUploaded] = useState(false)

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { language: 'EN', isEdition: false, coverImage: '', align: 'left' },
  })
  const coverImage = watch('coverImage') ?? ''
  const align = watch('align') ?? 'left'
  const categoryOptions = Array.from(new Set([...(editing?.category ? [editing.category] : []), ...categories]))

  useEffect(() => {
    if (open) {
      reset(editing
        ? {
            title: editing.title,
            summary: editing.summary,
            content: editing.content,
            category: editing.category,
            coverImage: editing.coverImage ?? '',
            language: editing.language.toUpperCase() as 'EN' | 'FR' | 'RW',
            isEdition: editing.isEdition,
            align: (editing as NewsArticle & { align?: ParagraphAlign }).align ?? 'left',
          }
        : { title: '', summary: '', content: '', category: '', coverImage: '', language: 'EN', isEdition: false, align: 'left' })
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
        {submitSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
            <CheckCircle2 size={15} /> Article saved.
          </div>
        )}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded font-lato text-sm">
            <AlertCircle size={15} /> {submitError}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="title" required>Title</FieldLabel>
          <FormInput id="title" type="text" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="summary" required>Summary</FieldLabel>
          <textarea
            id="summary"
            rows={2}
            className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:bg-form-highlight focus:border-w-600 focus:outline-none"
            {...register('summary')}
          />
          {errors.summary && <p className="text-red-600 text-xs mt-1 font-lato">{errors.summary.message}</p>}
        </div>

        <div>
          <FieldLabel htmlFor="content" required>Content</FieldLabel>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MarkdownEditor value={field.value ?? ''} onChange={field.onChange} height={320} language={watch('language') ?? 'EN'} />
            )}
          />
          {errors.content && <p className="text-red-600 text-xs mt-1 font-lato">{errors.content.message}</p>}
        </div>

        {/* Paragraph alignment */}
        <div>
          <FieldLabel htmlFor="article-align">Paragraph Alignment (reading view)</FieldLabel>
          <div className="flex gap-2 mt-1">
            {ALIGN_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('align', opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-lato cursor-pointer transition ${
                    align === opt.value
                      ? 'border-w-600 bg-w-100 text-w-950 font-semibold'
                      : 'border-w-300 text-w-700 hover:border-w-400'
                  }`}
                  aria-pressed={align === opt.value}
                >
                  <Icon size={13} /> {opt.label}
                </button>
              )
            })}
          </div>
          <p className="font-lato text-[11px] text-w-500 mt-1">Controls how paragraph text is aligned in the published article view.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="category" required>Category</FieldLabel>
            <select
              id="category"
              className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none"
              {...register('category')}
            >
              <option value="">{categoryOptions.length ? 'Select a category…' : 'No categories available'}</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-600 text-xs mt-1 font-lato">{errors.category.message}</p>}
            {!categoryOptions.length && (
              <p className="text-amber-700 text-xs mt-1 font-lato">
                No article categories exist yet. Create one in{' '}
                <a className="font-semibold underline" href="/dashboard/news/categories">News Categories</a> first, then reload this form.
              </p>
            )}
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
            <FormInput
              id="coverImage"
              type="text"
              placeholder="https://... (paste a URL, or upload below)"
              value={coverImage}
              onChange={(e) => { setValue('coverImage', e.target.value); setCoverUploaded(false) }}
            />
            <div className="mt-2">
              <CloudinaryUploadField
                id="coverImageFile"
                accept="image/*"
                label="Upload cover image"
                kind="image"
                value={coverUploaded ? coverImage : ''}
                onUploaded={(result) => { setValue('coverImage', result.url); setCoverUploaded(true) }}
                onClear={() => { setValue('coverImage', ''); setCoverUploaded(false) }}
              />
            </div>
            {coverImage && (
              <div className="relative w-full h-28 rounded overflow-hidden border border-w-300 bg-w-200 mt-2">
                <RemoteImage
                  src={coverImage}
                  alt="Cover preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                  fallback={<div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-w-400" /></div>}
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 font-lato text-sm text-w-950 mt-7">
            <input type="checkbox" {...register('isEdition')} />
            This is a full Edition (not a single article)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ElegantButton type="button" variant="outline" onClick={close}>Cancel</ElegantButton>
          <ElegantButton type="submit" loading={submitting} variant="primary">
            {editing ? 'Save Changes' : 'Create Article'}
          </ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
