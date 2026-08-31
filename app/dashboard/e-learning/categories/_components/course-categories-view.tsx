'use client'

import { useState } from 'react'
import { Pencil, Trash2, CheckCircle2, AlertCircle, Tag, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldLabel } from '@/components/ui/field-label'
import { FormInput } from '@/components/ui/form-input'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCourseCategories, addCourseCategory, updateCourseCategory, removeCourseCategory, type CourseCategory } from '../../_shared/use-course-categories'
import { useCourseCatalog } from '../../_shared/use-course-catalog'

/**
 * Admin CRUD for the Course Category vocabulary — the real, database-
 * backed source of the course "Category" dropdown (see
 * use-course-categories.ts). Single-page management (add/rename/delete)
 * so an admin no longer needs a code deploy to change the available
 * categories shown in the Add/Edit Course forms. A category can't be
 * deleted while courses still reference it (guarded server-side too).
 */
export function CourseCategoriesView() {
  const { data: categories, loading } = useCourseCategories()
  const { data: courses } = useCourseCatalog()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editing, setEditing] = useState<CourseCategory | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CourseCategory | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setEditing(null)
  }

  const startEdit = (c: CourseCategory) => {
    setEditing(c)
    setName(c.name)
    setDescription(c.description ?? '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast('Category name is required', 'error')
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateCourseCategory(editing.id, { name: name.trim(), description: description.trim() || undefined })
        showToast(`Category "${name.trim()}" updated.`)
      } else {
        await addCourseCategory({ name: name.trim(), description: description.trim() || undefined })
        showToast(`Category "${name.trim()}" created.`)
      }
      resetForm()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save this category — please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await removeCourseCategory(confirmDelete.id)
      showToast(`Category "${confirmDelete.name}" deleted.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete this category — please try again.', 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  const courseCountFor = (name: string) => courses.filter((c) => c.category === name).length

  return (
    <div className="max-w-3xl">
      {toast && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded font-lato text-sm border ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="card p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={16} className="text-w-600" />
          <h3 className="font-cinzel text-sm font-semibold text-w-950">
            {editing ? 'Edit Category' : 'Add Category'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="category-name" required>Name</FieldLabel>
              <FormInput
                id="category-name"
                type="text"
                placeholder="e.g. Theology"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="category-desc">Description (optional)</FieldLabel>
              <FormInput
                id="category-desc"
                type="text"
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ElegantButton type="submit" variant="primary" loading={submitting}>
              {editing ? 'Save Changes' : 'Add Category'}
            </ElegantButton>
            {editing && (
              <ElegantButton type="button" variant="outline" onClick={resetForm}>
                Cancel
              </ElegantButton>
            )}
          </div>
        </form>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-w-600" />
          <h3 className="font-cinzel text-sm font-semibold text-w-950">Categories ({categories.length})</h3>
        </div>

        {loading ? (
          <div className="space-y-2" aria-label="Loading course categories">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="font-lato text-sm text-w-600 bg-w-50 border border-w-200 rounded px-4 py-3">
            No categories yet. Add your first category above — it will appear in the Add/Edit Course category dropdown.
          </p>
        ) : (
          <ul className="divide-y divide-w-100 border border-w-200 rounded-lg overflow-hidden bg-white">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="font-lato text-sm font-semibold text-w-950">{c.name}</p>
                  {c.description && <p className="font-lato text-xs text-w-600 truncate">{c.description}</p>}
                  <p className="font-lato text-xs text-w-500">
                    {courseCountFor(c.name)} course{courseCountFor(c.name) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    aria-label={`Edit ${c.name}`}
                    className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    aria-label={`Delete ${c.name}`}
                    className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-w-950/50" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
          <div className="relative z-[10000] bg-white rounded-lg border border-w-300 w-full max-w-sm shadow-xl p-5">
            <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Delete category?</h3>
            <p className="font-lato text-sm text-w-700 mb-4">
              Are you sure you want to delete <span className="font-semibold">{confirmDelete.name}</span>?
              {courseCountFor(confirmDelete.name) > 0 && (
                <span className="block text-xs text-red-600 mt-1">
                  {courseCountFor(confirmDelete.name)} course(s) use this category and must be reassigned first.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <ElegantButton type="button" variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</ElegantButton>
              <ElegantButton type="button" variant="primary" className="!bg-red-600 !border-red-600 hover:!bg-red-700" onClick={handleDelete}>
                Delete
              </ElegantButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
