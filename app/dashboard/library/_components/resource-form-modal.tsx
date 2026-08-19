'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCategories } from '@/lib/kcs-taxonomy/use-categories'
import { type Resource } from './resources-data'
import { resourceSchema, defaultResourceFormValues, type ResourceFormData } from './resource-form-schema'
import { ResourceFormDetails } from './resource-form-details'

interface ResourceFormModalProps {
  open: boolean
  /** Row being edited, or null when creating a new resource. */
  editing: Resource | null
  onClose: () => void
  onSave: (data: ResourceFormData, editingId: string | null) => void
}

/** Create/Edit modal for a digital library resource — covers the full canonical Resource shape the Detail modal already displays. */
export function ResourceFormModal({ open, editing, onClose, onSave }: ResourceFormModalProps) {
  const [submitError, setSubmitError] = useState('')
  const { data: allCategories } = useCategories()
  /**
   * Leaf/scroll-level categories only, grouped under their root pillar label
   * — a real cataloguer classifies a specific book (e.g. "Genesis"), not a
   * whole pillar, so the picker offers scrolls, not the 8 roots. Computed
   * from the live `useCategories()` result (not a module-scope snapshot of
   * the old static array), since the taxonomy is now fetched, not seeded.
   */
  const leafCategories = allCategories.filter((c) => c.parentId !== null)
  const rootCategories = allCategories.filter((c) => c.parentId === null)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: defaultResourceFormValues,
  })

  useEffect(() => {
    if (open) {
      reset(editing
        ? {
            title: editing.title,
            author: editing.author,
            categoryId: editing.categoryId,
            isbn: editing.isbn,
            totalQty: editing.totalQty,
            description: editing.description,
            publisher: editing.publisher,
            language: editing.language,
            pages: editing.pages,
            price: editing.price,
            freePreviewChapterCount: editing.freePreviewChapterCount ?? 0,
            bindingType: editing.bindingType,
            mediaType: editing.mediaType,
            tags: editing.tags,
            coverImage: editing.coverImages[0] ?? '',
            documentUrl: editing.documentUrl ?? '',
            documentName: '',
            audioUrl: editing.audioUrl ?? '',
            audioName: '',
            videoUrl: editing.videoUrl ?? '',
            videoName: '',
          }
        : { ...defaultResourceFormValues, categoryId: leafCategories[0]?.id ?? '' })
      setSubmitError('')
    }
  }, [open, editing, reset])

  const onSubmit = (data: ResourceFormData) => {
    try {
      onSave(data, editing?.id ?? null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save resource')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Edit Resource: ${editing.title}` : 'Add New Resource'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
            <AlertCircle size={13} /> {submitError}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="title" required>Title</FieldLabel>
          <FormInput id="title" type="text" placeholder="Resource title" error={errors.title?.message} {...register('title')} />
        </div>

        <div>
          <FieldLabel htmlFor="author" required>Author</FieldLabel>
          <FormInput id="author" type="text" placeholder="Author name" error={errors.author?.message} {...register('author')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="categoryId" required>KCS Scroll</FieldLabel>
            <select id="categoryId" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('categoryId')}>
              {rootCategories.map((root) => (
                <optgroup key={root.id} label={`${root.name.en} (${root.code})`}>
                  {leafCategories.filter((c) => c.parentId === root.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name.en}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="isbn" required>ISBN</FieldLabel>
            <FormInput id="isbn" type="text" placeholder="KCS-XXX-001" error={errors.isbn?.message} {...register('isbn')} />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="totalQty" required>Total Quantity</FieldLabel>
          <FormInput id="totalQty" type="number" min={0} error={errors.totalQty?.message} {...register('totalQty', { valueAsNumber: true })} />
        </div>

        <ResourceFormDetails register={register} control={control} errors={errors} coverImageValue={watch('coverImage')} />

        <div className="flex gap-2 pt-2">
          <ElegantButton type="submit" variant="primary" className="flex-1 text-sm py-2">
            {editing ? 'Save Changes' : 'Add Resource'}
          </ElegantButton>
          <ElegantButton type="button" variant="outline" onClick={onClose} className="text-sm py-2 px-4">
            Cancel
          </ElegantButton>
        </div>
      </form>
    </Modal>
  )
}
