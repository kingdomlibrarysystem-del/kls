'use client'

import { useState } from 'react'
import { Settings2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EMPTY_CATEGORY_FORM, toSlug, resourceCountFor, type Category, type CategoryFormState } from '@/lib/kcs-taxonomy'
import { useCategories, addCategory, updateCategory, removeCategory } from '@/lib/kcs-taxonomy/use-categories'
import { useResources } from '@/app/dashboard/library/_components/use-resources'
import { ManageCategoriesTabs, type ManageCategoriesTab } from './manage-categories/manage-categories-tabs'
import { RootCategoriesPanel } from './manage-categories/root-categories-panel'
import { SubcategoriesPanel } from './manage-categories/subcategories-panel'
import { DeleteCategoryModal } from './manage-categories/delete-category-modal'
import { CategoriesStats } from './manage-categories/categories-stats'

/**
 * Full Categories CRUD, absorbed into the KCS Map page as its own distinct
 * section below the browse/analytics UI. Split into two tabs — Root
 * Categories (the 8 KCS pillars) and Subcategories (their scrolls) — since
 * each has a materially different form shape (pillar detail fields vs. a
 * required Parent Category + Status), rather than one form that toggles
 * fields based on whether Parent Category is empty.
 */
export function ManageCategoriesSection() {
  const { data: categories, loading: categoriesLoading } = useCategories()
  const { data: resources, loading: resourcesLoading } = useResources()
  const [tab, setTab] = useState<ManageCategoriesTab>('root')
  const [form, setForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM)
  const [errors, setErrors] = useState<Partial<CategoryFormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const resetForm = () => {
    setFormOpen(false)
    setEditTarget(null)
    setForm(EMPTY_CATEGORY_FORM)
    setErrors({})
  }

  const handleTabChange = (next: ManageCategoriesTab) => {
    setTab(next)
    resetForm()
  }

  const handleAddNew = () => {
    setEditTarget(null)
    setForm(EMPTY_CATEGORY_FORM)
    setErrors({})
    setFormOpen(true)
  }

  const handleNameEn = (value: string) => {
    setForm((f) => ({ ...f, nameEn: value, slug: toSlug(value) }))
    setErrors((e) => ({ ...e, nameEn: '', slug: '' }))
  }

  const validate = (): boolean => {
    const e: Partial<CategoryFormState> = {}
    if (!form.nameEn.trim()) e.nameEn = 'English name is required'
    if (!form.slug.trim()) e.slug = 'Slug is required'
    const slugExists = categories.some((c) => c.slug === form.slug && c.id !== editTarget?.id)
    if (slugExists) e.slug = 'Slug already exists'
    if (tab === 'sub' && !form.parentId) e.parentId = 'A parent category is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    try {
      const parentId = tab === 'root' ? null : form.parentId
      const extraFields =
        tab === 'root'
          ? { code: form.code, subtitle: form.subtitle, range: form.range, theme: form.theme, description: form.description, detail: form.detail, heroImage: form.heroImage }
          : { status: form.status || undefined }

      if (editTarget) {
        await updateCategory(editTarget.id, {
          slug: form.slug,
          name: { en: form.nameEn, fr: form.nameFr, rw: form.nameRw },
          parentId,
          ...extraFields,
        })
        showToast(`Category "${form.nameEn}" updated.`)
      } else {
        await addCategory({
          slug: form.slug,
          name: { en: form.nameEn, fr: form.nameFr || form.nameEn, rw: form.nameRw || form.nameEn },
          parentId,
          ...extraFields,
        })
        showToast(`Category "${form.nameEn}" created.`)
      }
      resetForm()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save this category — please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cat: Category) => {
    setEditTarget(cat)
    setForm({
      nameEn: cat.name.en, nameFr: cat.name.fr, nameRw: cat.name.rw, slug: cat.slug, parentId: cat.parentId ?? '',
      code: cat.code ?? '', subtitle: cat.subtitle ?? '', range: cat.range ?? '', theme: cat.theme ?? '',
      description: cat.description ?? '', detail: cat.detail ?? '', heroImage: cat.heroImage ?? '', status: cat.status ?? '',
    })
    setErrors({})
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const count = resourceCountFor(deleteTarget.id, resources)
    if (count > 0) {
      showToast(`Cannot delete — ${count} resource(s) still assigned.`, 'error')
      setDeleteTarget(null)
      return
    }
    try {
      await removeCategory(deleteTarget.id)
      showToast(`Category "${deleteTarget.name.en}" deleted.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this category — please try again.', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const panelProps = {
    categories, resources, form, errors, submitting, formOpen, editTarget,
    onAddNew: handleAddNew,
    onNameEnChange: handleNameEn,
    onFieldChange: (patch: Partial<CategoryFormState>) => { setForm((f) => ({ ...f, ...patch })); setErrors((err) => ({ ...err, ...(patch.slug !== undefined ? { slug: '' } : {}), ...(patch.parentId !== undefined ? { parentId: '' } : {}) })) },
    onSubmit: handleSubmit,
    onCancelEdit: resetForm,
    onEdit: handleEdit,
    onDelete: setDeleteTarget,
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="flex items-center gap-2 mb-1">
        <Settings2 size={16} color="var(--gold)" />
        <h2 className="cinzel" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Manage Categories</h2>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
        Create, edit, or delete KCS root categories and their subcategories — the same 8 root pillars and their scrolls shown above.
      </p>

      {(categoriesLoading || resourcesLoading) && (
        <div className="space-y-3 mb-4" aria-label="Loading category management data">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )}

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

      {!categoriesLoading && !resourcesLoading && (
        <>
          <CategoriesStats categories={categories} resources={resources} />

          <ManageCategoriesTabs
            active={tab}
            rootCount={categories.filter((c) => !c.parentId).length}
            subCount={categories.filter((c) => c.parentId).length}
            onChange={handleTabChange}
          />

          {tab === 'root' ? <RootCategoriesPanel {...panelProps} /> : <SubcategoriesPanel {...panelProps} />}

          <DeleteCategoryModal category={deleteTarget} resourceCount={deleteTarget ? resourceCountFor(deleteTarget.id, resources) : 0} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        </>
      )}
    </div>
  )
}
