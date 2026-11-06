'use client'

import { useState } from 'react'
import { AlertCircle, Check, Search } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RemoteImage } from '@/components/ui/remote-image'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { ChannelIcon } from '@/components/services/channel-icon'
import { SERVICE_CHANNEL_CODES, slugify, type ServiceChannelCode, type ServiceOfferingItem, type ServiceProgramItem } from '@/lib/services/shared'
import { formatRwf, type ShopProduct } from '@/lib/shop/shared'

const CHANNEL_TEXT: Record<ServiceChannelCode, { label: string; hint: string }> = {
  CALL: { label: 'Phone call', hint: 'Staff phone the member' },
  MESSAGE: { label: 'Messages', hint: 'Chat in Messages' },
  MEETING: { label: 'Online meeting', hint: 'Video meeting link' },
}

interface Props {
  program: ServiceProgramItem
  editing: ServiceOfferingItem | null
  products: ShopProduct[]
  onClose: () => void
  onSaved: (o: ServiceOfferingItem, message: string) => void
}

/** Add / edit a sub-service: text, ways to help (call / messages / meeting), linked shop products, price note, photo. */
export function OfferingFormModal({ program, editing, products, onClose, onSaved }: Props) {
  const [d, setD] = useState({
    name: editing?.name ?? '',
    slug: editing?.slug ?? '',
    summary: editing?.summary ?? '',
    description: editing?.description ?? '',
    image: editing?.image ?? '',
    priceNote: editing?.priceNote ?? '',
    channels: editing?.channels ?? (['CALL', 'MESSAGE', 'MEETING'] as ServiceChannelCode[]),
    productIds: editing?.productIds ?? [],
  })
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }))
  const slug = d.slug || slugify(d.name)
  const toggleChannel = (c: ServiceChannelCode) => set({ channels: d.channels.includes(c) ? d.channels.filter((x) => x !== c) : SERVICE_CHANNEL_CODES.filter((x) => x === c || d.channels.includes(x)) })
  const toggleProduct = (id: string) => set({ productIds: d.productIds.includes(id) ? d.productIds.filter((x) => x !== id) : [...d.productIds, id] })
  const shown = products.filter((p) => !q.trim() || `${p.title} ${p.categoryName}`.toLowerCase().includes(q.trim().toLowerCase()))

  const save = async () => {
    setBusy(true); setError('')
    try {
      const body = {
        name: d.name, slug, summary: d.summary || d.name, description: d.description.trim() || null, image: d.image || null,
        priceNote: d.priceNote.trim() || null, channels: d.channels, productIds: d.productIds,
      }
      const res = await fetch(editing ? `/api/services/offerings/${editing.id}` : `/api/services/programs/${program.id}/offerings`, {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save')
      onSaved(json.data, json.message)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={() => !busy && onClose()} title={editing ? `Edit ${editing.name}` : `Add a sub-service to ${program.name}`} size="xl">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="of-name">Name</Label><Input id="of-name" value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={100} placeholder="e.g. Skin health education" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="of-slug">Web address</Label>
            <Input id="of-slug" value={d.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder={slugify(d.name) || 'skin-health-education'} maxLength={60} />
            <p className="truncate text-xs text-muted-foreground">/services/{program.slug}/{slug || '…'}</p>
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="of-sum">Short summary</Label><Input id="of-sum" value={d.summary} onChange={(e) => set({ summary: e.target.value })} maxLength={240} placeholder="One line shown on the card" /></div>
        <div className="space-y-1.5"><Label htmlFor="of-desc">Description <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="of-desc" rows={4} value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={4000} /></div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Ways we can help</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {SERVICE_CHANNEL_CODES.map((c) => {
              const on = d.channels.includes(c)
              return (
                <button key={c} type="button" role="checkbox" aria-checked={on} onClick={() => toggleChannel(c)}
                  className={`flex items-center gap-2 rounded-lg border-[1.5px] p-2.5 text-left text-sm transition-colors ${on ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}>
                  <span className={`flex size-5 shrink-0 items-center justify-center rounded border ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{on && <Check className="size-3.5" />}</span>
                  <span><span className="flex items-center gap-1 font-medium text-foreground"><ChannelIcon channel={c} className="size-3.5" /> {CHANNEL_TEXT[c].label}</span><span className="block text-xs text-muted-foreground">{CHANNEL_TEXT[c].hint}</span></span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Products that go with this service <span className="font-normal text-muted-foreground">({d.productIds.length} chosen)</span></Label>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-8" aria-label="Search products" />
            </div>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shop products yet — add them under Beauty &amp; Shop → Shop Products.</p>
          ) : (
            <ul className="grid max-h-64 gap-1.5 overflow-y-auto rounded-lg border border-border p-1.5 sm:grid-cols-2">
              {shown.map((p) => {
                const on = d.productIds.includes(p.id)
                return (
                  <li key={p.id}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => toggleProduct(p.id)}
                      className={`flex w-full items-center gap-2 rounded-md border p-1.5 text-left transition-colors ${on ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted/50'}`}>
                      <span className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
                        <RemoteImage src={p.images[0]} alt="" fill sizes="40px" className="object-cover" fallback={null} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{p.title}</span>
                        <span className="block text-xs text-muted-foreground">{formatRwf(p.priceRwf)} · {p.categoryName}{p.status !== 'ACTIVE' ? ' · not for sale' : ''}</span>
                      </span>
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded border ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{on && <Check className="size-3.5" />}</span>
                    </button>
                  </li>
                )
              })}
              {shown.length === 0 && <li className="p-2 text-sm text-muted-foreground">No product matches “{q}”.</li>}
            </ul>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="of-price">Price note <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="of-price" value={d.priceNote} onChange={(e) => set({ priceNote: e.target.value })} maxLength={60} placeholder="e.g. Free, or From 5,000 RWF" /></div>
          <div className="space-y-1.5">
            <Label>Photo <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <CloudinaryUploadField id="of-image" kind="image" accept="image/*" label={d.image ? 'Change photo' : 'Upload photo'} value={d.image} onUploaded={(r) => set({ image: r.url })} onClear={() => set({ image: '' })} />
          </div>
        </div>

        {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || d.name.trim().length < 2 || d.channels.length === 0}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
