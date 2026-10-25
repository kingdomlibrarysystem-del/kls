'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import type { ShopCategory } from '@/lib/shop/shared'

/** Shop categories: add, rename, show/hide in the shop, delete when unused. */
export function CategoriesView({ initialCategories }: { initialCategories: ShopCategory[] }) {
  const [rows, setRows] = useState(initialCategories)
  const [form, setForm] = useState<{ editing: ShopCategory | null; name: string; description: string } | null>(null)
  const [deleting, setDeleting] = useState<ShopCategory | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500) }

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong')
    return json.data
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    if (form.name.trim().length < 2) { setFormError('Category name is too short'); return }
    setBusy(true)
    setFormError('')
    try {
      const body = { name: form.name.trim(), description: form.description.trim() || null }
      const saved = form.editing ? await call(`/api/shop/categories/${form.editing.id}`, 'PATCH', body) : await call('/api/shop/categories', 'POST', body)
      setRows((list) => form.editing ? list.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)) : [...list, saved])
      flash(true, form.editing ? 'Category saved' : 'Category added')
      setForm(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (c: ShopCategory, active: boolean) => {
    try {
      await call(`/api/shop/categories/${c.id}`, 'PATCH', { active })
      setRows((list) => list.map((x) => (x.id === c.id ? { ...x, active } : x)))
      flash(true, active ? `“${c.name}” is visible in the shop` : `“${c.name}” and its products are hidden from the shop`)
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await call(`/api/shop/categories/${deleting.id}`, 'DELETE')
      setRows((list) => list.filter((c) => c.id !== deleting.id))
      flash(true, 'Category deleted')
      setDeleting(null)
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<ShopCategory>[] = [
    {
      key: 'name', label: 'Category', sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-foreground">{c.name}</p>
          {c.description && <p className="max-w-md text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ),
    },
    { key: 'productCount', label: 'Products', sortable: true, render: (c) => <span className="tabular-nums">{c.productCount ?? 0}</span> },
    {
      key: 'active', label: 'Shown in shop',
      render: (c) => <div className="flex items-center gap-2"><Switch checked={c.active} onCheckedChange={(on) => toggle(c, on)} aria-label={`Show ${c.name} in the shop`} />{!c.active && <Badge variant="outline">Hidden</Badge>}</div>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setFormError(''); setForm({ editing: c, name: c.name, description: c.description ?? '' }) }}><Pencil /> Edit</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={(c.productCount ?? 0) > 0} title={(c.productCount ?? 0) > 0 ? 'Move its products to another category first' : undefined} onClick={() => setDeleting(c)}><Trash2 /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {toast && (
        <p role="status" className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />} {toast.text}
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={() => { setFormError(''); setForm({ editing: null, name: '', description: '' }) }}><Plus /> Add category</Button>
      </div>
      <DataTable<ShopCategory> data={rows} columns={columns} rowKey={(c) => c.id} searchPlaceholder="Search categories…" searchFilter={(c, q) => c.name.toLowerCase().includes(q)} emptyMessage="No categories yet — add the first one (e.g. Skin care, Hair, Fragrance)." />

      <Modal open={!!form} onClose={() => { if (!busy) setForm(null) }} title={form?.editing ? 'Edit Category' : 'Add Category'} size="sm">
        {form && (
          <form onSubmit={save} className="space-y-4">
            {formError && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"><AlertCircle className="size-3.5" /> {formError}</p>}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} autoFocus placeholder="e.g. Skin care" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input id="cat-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Save</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Category" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Delete <b className="text-foreground">{deleting?.name}</b>? It has no products.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={remove}>{busy && <Loader2 className="animate-spin" />} Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
