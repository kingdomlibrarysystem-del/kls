'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, AlertCircle, UploadCloud, Save, Send } from 'lucide-react'
import { FormSection } from '@/components/ui/form-section'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { bookSchema, bookCategories, bookLanguages, languageLabels, type BookFormData, type SubmitAction } from './book-form-schema'

/**
 * Submit a Book form. Two distinct actions produce different resulting
 * Publication statuses: "Save Draft" (DRAFT) and "Submit for Review"
 * (SUBMITTED) — both fully mocked, with a short simulated delay and inline
 * confirmation naming the resulting status.
 */
export function BookFormView() {
  const [pendingAction, setPendingAction] = useState<SubmitAction | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [savedStatus, setSavedStatus] = useState<'DRAFT' | 'SUBMITTED' | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: { language: 'en' },
  })

  const runSubmit = (action: SubmitAction) => handleSubmit(async (data: BookFormData) => {
    setPendingAction(action)
    setSubmitError('')
    setSavedStatus(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (!data.title.trim()) throw new Error('Title cannot be empty')
      const resultStatus = action === 'draft' ? 'DRAFT' : 'SUBMITTED'
      setSavedStatus(resultStatus)
      reset({ title: '', description: '', category: '', language: 'en' })
      setTimeout(() => setSavedStatus(null), 4000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save publication')
    } finally {
      setPendingAction(null)
    }
  })

  return (
    <div className="max-w-2xl">
      <FormSection title="Book Details">
        <form>
          {savedStatus && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4 font-lato text-sm">
              <CheckCircle2 size={15} />
              {savedStatus === 'DRAFT' ? 'Saved as draft.' : 'Submitted for review.'} Status: {savedStatus}
            </div>
          )}
          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 font-lato text-sm">
              <AlertCircle size={15} /> {submitError}
            </div>
          )}

          <div>
            <FieldLabel htmlFor="title" required>Book Title</FieldLabel>
            <FormInput id="title" type="text" placeholder="e.g. Walking in Covenant" error={errors.title?.message} {...register('title')} />
          </div>

          <div>
            <FieldLabel htmlFor="description" required>Description</FieldLabel>
            <textarea
              id="description"
              rows={4}
              placeholder="Summarize the book's message and audience…"
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
                {bookCategories.map((c) => <option key={c} value={c}>{c}</option>)}
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
                {bookLanguages.map((l) => <option key={l} value={l}>{languageLabels[l]}</option>)}
              </select>
            </div>
          </div>

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

          <div className="flex gap-2 mt-2">
            <ElegantButton
              type="button"
              variant="outline"
              loading={pendingAction === 'draft'}
              onClick={runSubmit('draft')}
            >
              <Save size={14} className="inline-block mr-1" /> Save Draft
            </ElegantButton>
            <ElegantButton
              type="button"
              variant="primary"
              loading={pendingAction === 'review'}
              onClick={runSubmit('review')}
            >
              <Send size={14} className="inline-block mr-1" /> Submit for Review
            </ElegantButton>
          </div>
        </form>
      </FormSection>
    </div>
  )
}
