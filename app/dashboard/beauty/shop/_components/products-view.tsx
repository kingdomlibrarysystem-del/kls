'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Archive, CheckCircle2, ExternalLink, Loader2, Pencil, Plus, RotateCcw, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import { formatRwf, type ShopCategory, type ShopProduct } from '@/lib/shop/shared'
import { ProductFormModal } from './product-form-modal'

const STATUS: Record<ShopProduct['status'], { label: string; cls: string }> = {
  ACTIVE: { label: 'For sale', cls: 'border-success/30 bg-success/10 text-success' },
  DRAFT: { label: 'Draft', cls: 'border-border bg-muted text-muted-foreground' },
  ARCHIVED: { label: 'Archived', cls: 'border-warning/30 bg-warning/10 text-warning' },
}

interface Props {
  initialProducts: ShopProduct[]
  categories: ShopCategory[]
  initialDeliveryFee: number
}

/** Shop products for staff: list, add/edit, Trash (restorable) and permanent delete, plus the delivery fee. */
export function ProductsView({ initialProducts, categories, initialDeliveryFee }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [tab, setTab] = useState<'products' | 'trash'>('products')
  const [form, setForm] = useState<{ editing: ShopProduct | null } | null>(null)
  const [confirm, setConfirm] = useState<{ product: ShopProduct; kind: 'trash' | 'permanent' } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [fee, setFee] = useState(String(initialDeliveryFee))
  const [savingFee, setSavingFee] = useState(false)

  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500) }
  const live = products.filter((p) => !p.inTrash)
  const trashed = products.filter((p) => p.inTrash)

  const call = async (url: string, init: RequestInit) => {
    const res = await fetch(url, init)
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong')
    return json
  }

  const doConfirm = async () => {
    if (!confirm) return
    const { product, kind } = confirm
    setBusy(product.id)
    try {
      const json = await call(`/api/shop/products/${product.id}${kind === 'permanent' ? '?permanent=1' : ''}`, { method: 'DELETE' })
      setProducts((list) => (kind === 'permanent' ? list.filter((p) => p.id !== product.id) : list.map((p) => (p.id === product.id ? { ...p, inTrash: true } : p))))
      flash(true, json.message)
    } catch (e) {
      flash(false, e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
      setConfirm(null)
    }
  }

  const restore = async (product: ShopProduct) => {
    setBusy(product.id)
    try {
      const json = await call(`/api/shop/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) })
      setProducts((list) => list.map((p) => (p.id === product.id ? json.data : p)))
      flash(true, 'Product restored')
    } catch (e) {
      flash(false, e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const saveFee = async () => {
    setSavingFee(true)
    try {
      await call('/api/shop/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveryFeeRwf: Number(fee) || 0 }) })
      flash(true, `Delivery fee saved: ${Number(fee) > 0 ? formatRwf(Number(fee)) : 'free'}`)
    } catch (e) {
      flash(false, e instanceof Error ? e.message : 'Could not save the fee')
    } finally {
      setSavingFee(false)
    }
  }

  const columns: Column<ShopProduct>[] = [
    {
      key: 'title', label: 'Product', sortable: true,
      render: (p) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            <RemoteImage src={p.images[0]} alt="" fill sizes="48px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-4" /></div>} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.categoryName} · {p.images.length} photo{p.images.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'priceRwf', label: 'Price', sortable: true,
      render: (p) => (
        <div className="whitespace-nowrap">
          <p className="font-semibold tabular-nums">{formatRwf(p.priceRwf)}</p>
          {p.compareAtPriceRwf && <p className="text-xs text-muted-foreground line-through">{formatRwf(p.compareAtPriceRwf)}</p>}
        </div>
      ),
    },
    {
      key: 'stockQty', label: 'Stock', sortable: true,
      render: (p) => <span className={cn('font-semibold tabular-nums', p.stockQty === 0 ? 'text-destructive' : p.stockQty <= 3 ? 'text-warning' : 'text-foreground')}>{p.stockQty === 0 ? 'Sold out' : p.stockQty}</span>,
    },
    { key: 'soldCount', label: 'Sold', sortable: true, render: (p) => <span className="tabular-nums text-muted-foreground">{p.soldCount}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (p) => <Badge variant="outline" className={STATUS[p.status].cls}>{STATUS[p.status].label}</Badge> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (p) => p.inTrash ? (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" disabled={busy === p.id} onClick={() => restore(p)}>{busy === p.id ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restore</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm({ product: p, kind: 'permanent' })}><Trash2 /> Delete permanently</Button>
        </div>
      ) : (
        <div className="flex justify-end gap-1.5">
          {p.status === 'ACTIVE' && <Link href={`/shop/${p.id}`} target="_blank" aria-label="Open in the shop" className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" /></Link>}
          <Button variant="outline" size="sm" onClick={() => setForm({ editing: p })}><Pencil /> Edit</Button>
          <Button variant="outline" size="sm" onClick={() => setConfirm({ product: p, kind: 'trash' })} aria-label={`Move ${p.title} to Trash`}><Archive /> Trash</Button>
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

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-1 border-b border-border" role="tablist">
          {(['products', 'trash'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors', tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t === 'products' ? `Products (${live.length})` : `Trash (${trashed.length})`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-end gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5">
            <Truck className="mb-2 size-4 text-primary" />
            <div>
              <label htmlFor="delivery-fee" className="block text-[11px] text-muted-foreground">Delivery fee (RWF)</label>
              <Input id="delivery-fee" type="number" min={0} step={100} value={fee} onChange={(e) => setFee(e.target.value)} className="h-8 w-28" />
            </div>
            <Button size="sm" variant="outline" disabled={savingFee} onClick={saveFee}>{savingFee ? <Loader2 className="animate-spin" /> : 'Save'}</Button>
          </div>
          <Button onClick={() => setForm({ editing: null })} disabled={categories.length === 0} title={categories.length === 0 ? 'Add a category first' : undefined}><Plus /> Add product</Button>
        </div>
      </div>

      {categories.length === 0 && (
        <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-foreground">
          Add at least one category on <Link href="/dashboard/beauty/shop/categories" className="font-semibold underline">Shop Categories</Link> before adding products.
        </p>
      )}

      <DataTable<ShopProduct>
        data={tab === 'products' ? live : trashed}
        columns={columns}
        rowKey={(p) => p.id}
        searchPlaceholder="Search products…"
        searchFilter={(p, q) => p.title.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q)}
        emptyMessage={tab === 'products' ? 'No products yet — use “Add product”.' : 'Trash is empty.'}
      />

      {form && (
        <ProductFormModal
          key={form.editing?.id ?? 'new'}
          editing={form.editing}
          categories={categories}
          onClose={() => setForm(null)}
          onSaved={(saved, wasEditing) => {
            setProducts((list) => (wasEditing ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list]))
            setForm(null)
            flash(true, wasEditing ? 'Product saved' : `“${saved.title}” added${saved.status === 'ACTIVE' ? ' — members can buy it now' : ''}`)
          }}
        />
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.kind === 'permanent' ? 'Delete permanently?' : 'Move to Trash?'} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {confirm?.kind === 'permanent'
              ? <>“{confirm.product.title}” will be deleted for good. Past orders keep their own copy of its name, price and photo.</>
              : <>“{confirm?.product.title}” will be hidden from the shop and removed from carts at checkout. You can restore it from the Trash tab.</>}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!!busy} onClick={doConfirm}>{busy && <Loader2 className="animate-spin" />} {confirm?.kind === 'permanent' ? 'Delete permanently' : 'Move to Trash'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
