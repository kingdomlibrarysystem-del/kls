'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { ElegantButton } from '@/components/ui/elegant-button'
import { FormInput } from '@/components/ui/form-input'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { DEFAULT_CATEGORY_COLOR, CATEGORY_COLOR_PRESETS } from '../../_shared/news-data'

interface NewsCategory {
  id: string
  name: string
  description?: string | null
  color?: string | null
  createdAt: string
}

async function fetchCategories(): Promise<NewsCategory[]> {
  const res = await fetch('/api/news/categories')
  const json = await res.json()
  if (json.code !== 'success') throw new Error(json.message ?? 'Failed to load categories')
  return json.data
}

export function NewsCategoriesView() {
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NewsCategory | null>(null)
  const [deleting, setDeleting] = useState<NewsCategory | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')

  const load = () => {
    setLoading(true)
    fetchCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((data) => { if (!cancelled) setCategories(data) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setColor(DEFAULT_CATEGORY_COLOR); setFormError(''); setFormOpen(true) }
  const openEdit = (c: NewsCategory) => { setEditing(c); setName(c.name); setDescription(c.description ?? ''); setColor(c.color || DEFAULT_CATEGORY_COLOR); setFormError(''); setFormOpen(true) }

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true); setFormError('')
    try {
      if (editing) {
        const res = await fetch(`/api/news/categories/${editing.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
        })
        const json = await res.json()
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update')
        showToast(`Updated "${name}"`)
      } else {
        const res = await fetch('/api/news/categories', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
        })
        const json = await res.json()
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create')
        showToast(`Created "${name}"`)
      }
      setFormOpen(false)
      load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setSaving(true)
    try {
      const res = await fetch(`/api/news/categories/${deleting.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete')
      showToast(`Deleted "${deleting.name}"`)
      setDeleting(null)
      load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-48 w-full rounded-lg" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load categories" description={error} />

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <div className="flex justify-end mb-4">
        <ElegantButton variant="primary" onClick={openCreate} className="flex items-center gap-1.5">
          <PlusCircle size={15} /> New Category
        </ElegantButton>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No categories yet" description="Add categories so editors can tag articles consistently." />
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 border border-w-200 rounded-lg bg-white">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: c.color || DEFAULT_CATEGORY_COLOR }}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-lato font-semibold text-sm text-w-950">{c.name}</p>
                  {c.description && <p className="font-lato text-xs text-w-600 mt-0.5">{c.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(c)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors cursor-pointer">
                  <Pencil size={12} /> Edit
                </button>
                <button onClick={() => setDeleting(c)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors cursor-pointer">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Category' : 'New Category'} size="sm">
        <div className="space-y-3">
          {formError && <p className="text-red-600 text-xs font-lato">{formError}</p>}
          <div>
            <label className="font-lato text-xs font-semibold text-w-800 block mb-1">Name *</label>
            <FormInput id="cat-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ministry Updates" />
          </div>
          <div>
            <label className="font-lato text-xs font-semibold text-w-800 block mb-1">Description (optional)</label>
            <FormInput id="cat-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div>
            <label className="font-lato text-xs font-semibold text-w-800 block mb-1.5">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORY_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 ${color === hex ? 'ring-2 ring-offset-2 ring-w-950' : ''}`}
                  style={{ background: hex }}
                  aria-label={`Use color ${hex}`}
                />
              ))}
              <label className="flex items-center gap-1.5 cursor-pointer ml-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 cursor-pointer border border-w-300 rounded"
                  aria-label="Custom color"
                />
                <span className="font-lato text-xs text-w-600" style={{ color: 'var(--text-muted)' }}>Custom</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <ElegantButton type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</ElegantButton>
            <ElegantButton type="button" variant="primary" loading={saving} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Create'}
            </ElegantButton>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Category" size="sm">
        <p className="font-lato text-sm text-w-800 mb-4">
          Delete <strong>{deleting?.name}</strong>? Existing articles using this category will keep their category text but it will no longer appear in the dropdown.
        </p>
        <div className="flex justify-end gap-2">
          <ElegantButton type="button" variant="outline" onClick={() => setDeleting(null)}>Cancel</ElegantButton>
          <ElegantButton type="button" variant="outline" className="!border-red-300 !text-red-700 hover:!bg-red-50" loading={saving} onClick={handleDelete}>Delete</ElegantButton>
        </div>
      </Modal>
    </div>
  )
}
