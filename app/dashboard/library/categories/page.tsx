'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { EMPTY_FORM, mockCategories, toSlug, type Category, type FormState } from './_components/categories-data'
import { CategoryFormPanel } from './_components/category-form-panel'
import { CategoriesTable } from './_components/categories-table'
import { CategoryDetailModal } from './_components/category-detail-modal'
import { DeleteCategoryModal } from './_components/delete-category-modal'

/** KCS Categories: full CRUD plus a details view over the mocked category taxonomy. */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [viewTarget, setViewTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleNameEn = (value: string) => {
    setForm((f) => ({ ...f, nameEn: value, slug: toSlug(value) }))
    setErrors((e) => ({ ...e, nameEn: '', slug: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<FormState> = {}
    if (!form.nameEn.trim()) e.nameEn = 'English name is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    const slugExists = categories.some((c) => c.slug === form.slug && c.id !== editTarget?.id)
    if (slugExists) e.slug = 'Slug already exists'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    setTimeout(() => {
      try {
        if (editTarget) {
          setCategories((prev) => prev.map((c) =>
            c.id === editTarget.id
              ? { ...c, slug: form.slug, name: { en: form.nameEn, fr: form.nameFr, rw: form.nameRw }, parentId: form.parentId || null, parentName: categories.find((x) => x.id === form.parentId)?.name.en ?? null }
              : c
          ))
          showToast(`Category "${form.nameEn}" updated.`)
          setEditTarget(null)
        } else {
          const newCat: Category = {
            id: crypto.randomUUID(),
            slug: form.slug,
            name: { en: form.nameEn, fr: form.nameFr || form.nameEn, rw: form.nameRw || form.nameEn },
            parentId: form.parentId || null,
            parentName: categories.find((c) => c.id === form.parentId)?.name.en ?? null,
            resourceCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
          }
          setCategories((prev) => [newCat, ...prev])
          showToast(`Category "${form.nameEn}" created.`)
        }
        setForm(EMPTY_FORM)
      } catch {
        showToast('Could not save this category — please try again.', 'error')
      } finally {
        setSubmitting(false)
      }
    }, 600)
  }

  const handleEdit = (cat: Category) => {
    setEditTarget(cat)
    setForm({ nameEn: cat.name.en, nameFr: cat.name.fr, nameRw: cat.name.rw, slug: cat.slug, parentId: cat.parentId ?? '' })
    setErrors({})
  }

  const handleCancelEdit = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.resourceCount > 0) {
      showToast(`Cannot delete — ${deleteTarget.resourceCount} resource(s) still assigned.`, 'error')
      setDeleteTarget(null)
      return
    }
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    showToast(`Category "${deleteTarget.name.en}" deleted.`)
    setDeleteTarget(null)
  }

  const parentOptions = categories.filter((c) => !c.parentId && c.id !== editTarget?.id)

  return (
    <PageTransition>
      <PageHeader title="KCS Categories" subtitle="Kingdom Classification System — 8 root sections with their scrolls as sub-categories" />

      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded font-lato text-sm border ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-lato text-xs text-w-600 dark:text-white/50 uppercase tracking-wider font-semibold">{categories.length} categories total</p>
          </div>
          <CategoriesTable categories={categories} onView={setViewTarget} onEdit={handleEdit} onDelete={setDeleteTarget} />
        </div>

        <CategoryFormPanel
          form={form}
          errors={errors}
          submitting={submitting}
          editTarget={editTarget}
          parentOptions={parentOptions}
          onNameEnChange={handleNameEn}
          onFieldChange={(patch) => { setForm((f) => ({ ...f, ...patch })); setErrors((e) => ({ ...e, ...(patch.slug !== undefined ? { slug: '' } : {}) })) }}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
        />
      </div>

      <CategoryDetailModal category={viewTarget} onClose={() => setViewTarget(null)} />
      <DeleteCategoryModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </PageTransition>
  )
}
