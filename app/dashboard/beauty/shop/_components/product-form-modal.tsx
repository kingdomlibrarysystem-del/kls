'use client'

import { useState } from 'react'
import { AlertCircle, ArrowLeft, Loader2, Star, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { RemoteImage } from '@/components/ui/remote-image'
import type { ShopCategory, ShopProduct } from '@/lib/shop/shared'

const MAX_IMAGES = 8
const selectCls = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

interface Props {
  editing: ShopProduct | null
  categories: ShopCategory[]
  onClose: () => void
  onSaved: (product: ShopProduct, wasEditing: boolean) => void
}

/** Add / edit a product: photos (first = main, up to 8), name, category, price in RWF, optional "was" price, stock, status, description. */
export function ProductFormModal({ editing, categories, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? categories.find((c) => c.active)?.id ?? '')
  const [price, setPrice] = useState(editing ? String(editing.priceRwf) : '')
  const [was, setWas] = useState(editing?.compareAtPriceRwf ? String(editing.compareAtPriceRwf) : '')
  const [stock, setStock] = useState(editing ? String(editing.stockQty) : '1')
  const [status, setStatus] = useState<ShopProduct['status']>(editing?.status ?? 'ACTIVE')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [images, setImages] = useState<string[]>(editing?.images ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const priceNum = Number(price)
    if (title.trim().length < 2) return setError('Give the product a name')
    if (!categoryId) return setError('Choose a category (add one on the Shop Categories page first)')
    if (!Number.isInteger(priceNum) || priceNum < 100) return setError('Enter the price in RWF (at least 100)')
    if (was && (!Number.isInteger(Number(was)) || Number(was) <= priceNum)) return setError('The "was" price must be higher than the price, or leave it empty')
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) return setError('Enter how many are in stock')
    if (description.trim().length < 10) return setError('Describe the product (at least 10 characters)')
    if (images.length === 0) return setError('Add at least one photo')

    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/shop/products/${editing.id}` : '/api/shop/products', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(), categoryId, priceRwf: priceNum, compareAtPriceRwf: was ? Number(was) : null,
          stockQty: Number(stock), status, description: description.trim(), images,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save the product')
      onSaved(json.data, !!editing)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the product')
      setSaving(false)
    }
  }

  const makeMain = (i: number) => setImages((list) => [list[i], ...list.filter((_, j) => j !== i)])

  return (
    <Modal open onClose={() => { if (!saving) onClose() }} title={editing ? `Edit: ${editing.title}` : 'Add Product'} size="3xl">
      <form onSubmit={save} className="space-y-5">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>Photos <span className="font-normal text-muted-foreground">({images.length}/{MAX_IMAGES} — the first is the main photo)</span></Label>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={src + i} className="group relative size-24 overflow-hidden rounded-lg border border-border bg-muted">
                <RemoteImage src={src} alt={`Photo ${i + 1}`} fill sizes="96px" className="object-cover" fallback={<div className="size-full" />} />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  {i > 0 ? <button type="button" onClick={() => makeMain(i)} className="rounded p-0.5 text-white hover:bg-white/20" aria-label={`Make photo ${i + 1} the main photo`}><Star className="size-3.5" /></button> : <span />}
                  {i > 0 && <button type="button" onClick={() => setImages((l) => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n })} className="rounded p-0.5 text-white hover:bg-white/20" aria-label={`Move photo ${i + 1} left`}><ArrowLeft className="size-3.5" /></button>}
                  <button type="button" onClick={() => setImages((l) => l.filter((_, j) => j !== i))} className="rounded p-0.5 text-white hover:bg-white/20" aria-label={`Remove photo ${i + 1}`}><X className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
          {images.length < MAX_IMAGES && (
            <CloudinaryUploadField
              key={images.length}
              id="product-photo"
              kind="image"
              accept="image/*"
              label={images.length === 0 ? 'Upload the main photo' : 'Add another photo'}
              value=""
              onUploaded={(r) => setImages((l) => (l.length < MAX_IMAGES ? [...l, r.url] : l))}
              onClear={() => {}}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-title">Product name</Label>
            <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="e.g. Shea butter body cream 250ml" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-category">Category</Label>
            <select id="p-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectCls}>
              <option value="">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{!c.active ? ' (hidden)' : ''}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-status">Status</Label>
            <select id="p-status" value={status} onChange={(e) => setStatus(e.target.value as ShopProduct['status'])} className={selectCls}>
              <option value="ACTIVE">For sale</option>
              <option value="DRAFT">Draft (hidden from members)</option>
              <option value="ARCHIVED">Archived (no longer sold)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-price">Price (RWF)</Label>
            <Input id="p-price" type="number" min={100} step={50} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 8500" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-was">&quot;Was&quot; price <span className="font-normal text-muted-foreground">(optional, for a discount)</span></Label>
            <Input id="p-was" type="number" min={0} step={50} inputMode="numeric" value={was} onChange={(e) => setWas(e.target.value)} placeholder="e.g. 10000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-stock">In stock</Label>
            <Input id="p-stock" type="number" min={0} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={5000} placeholder="What it is, size, ingredients / materials, how to use…" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</Button>
        </div>
      </form>
    </Modal>
  )
}
