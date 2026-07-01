'use client'

import { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { categoryOptions, type Resource } from './resources-data'

const resourceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  author: z.string().min(2, 'Author is required'),
  category: z.string().min(1, 'Select a category'),
  isbn: z.string().min(3, 'ISBN is required'),
  totalQty: z.number().int().min(0, 'Must be 0 or more'),
})

type ResourceFormData = z.infer<typeof resourceSchema>

interface ResourceFormModalProps {
  open: boolean
  /** Row being edited, or null when creating a new resource. */
  editing: Resource | null
  onClose: () => void
  onSave: (data: ResourceFormData, editingId: string | null) => void
}

/** Create/Edit modal for a digital library resource. */
export function ResourceFormModal({ open, editing, onClose, onSave }: ResourceFormModalProps) {
  const [submitError, setSubmitError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { title: '', author: '', category: categoryOptions[0], isbn: '', totalQty: 1 },
  })

  useEffect(() => {
    if (open) {
      reset(editing
        ? { title: editing.title, author: editing.author, category: editing.category, isbn: editing.isbn, totalQty: editing.totalQty }
        : { title: '', author: '', category: categoryOptions[0], isbn: '', totalQty: 1 })
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
            <FieldLabel htmlFor="category" required>KCS Section</FieldLabel>
            <select id="category" className="w-full px-4 py-3 font-lato text-sm border border-w-500 bg-form-bg rounded focus:border-w-600 focus:outline-none" {...register('category')}>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
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
