'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { updateCategory } from '@/lib/kcs-taxonomy/use-categories'
import { toSlug, EMPTY_CATEGORY_FORM, type Category, type CategoryFormState } from '@/lib/kcs-taxonomy'
import { CategoryFormPanel } from '../../../_components/manage-categories/category-form-panel'

interface CategoryEditModalProps {
  category: Category | null
  parentOptions: Category[]
  open: boolean
  onClose: () => void
  onSaved: (updated: Category) => void
}

/** Edit-in-place modal for a single category, wiring CategoryFormPanel's form state to a real PATCH /api/categories/:id. Split out of CategoryDetailView to keep that file under the 200-line ceiling. */
export function CategoryEditModal({ category, parentOptions, open, onClose, onSaved }: CategoryEditModalProps) {
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormState>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !category) return
    setForm({
      nameEn: category.name.en, nameFr: category.name.fr, nameRw: category.name.rw, slug: category.slug, parentId: category.parentId ?? '',
      code: category.code ?? '', subtitle: category.subtitle ?? '', range: category.range ?? '', theme: category.theme ?? '',
      description: category.description ?? '', detail: category.detail ?? '', heroImage: category.heroImage ?? '', status: category.status ?? '',
    })
    setFormErrors({})
  }, [open, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) return
    if (!form.nameEn.trim() || !form.slug.trim()) {
      setFormErrors({
        nameEn: form.nameEn.trim() ? '' : 'English name is required',
        slug: form.slug.trim() ? '' : 'Slug is required',
      })
      return
    }
    setSubmitting(true)
    try {
      const isRoot = !form.parentId
      const extraFields = isRoot
        ? { code: form.code, subtitle: form.subtitle, range: form.range, theme: form.theme, description: form.description, detail: form.detail, heroImage: form.heroImage }
        : { status: form.status || undefined }
      const updated = await updateCategory(category.id, {
        slug: form.slug,
        name: { en: form.nameEn, fr: form.nameFr, rw: form.nameRw },
        parentId: form.parentId || null,
        ...extraFields,
      })
      onSaved(updated)
      setForm(EMPTY_CATEGORY_FORM)
    } catch (err) {
      setFormErrors({ slug: err instanceof Error ? err.message : 'Could not save this category' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setForm(EMPTY_CATEGORY_FORM)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit Category" size="lg">
      <CategoryFormPanel
        form={form}
        errors={formErrors}
        submitting={submitting}
        editTarget={category}
        parentOptions={parentOptions}
        onNameEnChange={(value) => { setForm((f) => ({ ...f, nameEn: value, slug: toSlug(value) })); setFormErrors((e) => ({ ...e, nameEn: '', slug: '' })) }}
        onFieldChange={(patch) => { setForm((f) => ({ ...f, ...patch })); setFormErrors((e) => ({ ...e, ...(patch.slug !== undefined ? { slug: '' } : {}) })) }}
        onSubmit={handleSubmit}
        onCancelEdit={handleClose}
      />
    </Modal>
  )
}
