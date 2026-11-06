'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { normalizeColorKey, slugify, type ServiceProgramItem } from '@/lib/services/shared'
import { ColorPicker, IconPicker } from './pickers'

interface Props {
  editing: ServiceProgramItem | null
  onClose: () => void
  onSaved: (p: ServiceProgramItem, message: string) => void
}

/** Add / edit a programme (its sub-services are managed separately). */
export function ProgramFormModal({ editing, onClose, onSaved }: Props) {
  const [d, setD] = useState({
    name: editing?.name ?? '',
    slug: editing?.slug ?? '',
    tagline: editing?.tagline ?? '',
    description: editing?.description ?? '',
    image: editing?.image ?? '',
    icon: editing?.icon ?? 'sparkles',
    color: normalizeColorKey(editing?.color ?? 'gold'),
    ctaLabel: editing?.ctaLabel ?? '',
    ctaHref: editing?.ctaHref ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }))
  const slug = d.slug || slugify(d.name)

  const save = async () => {
    setBusy(true); setError('')
    try {
      const body = {
        name: d.name, slug, tagline: d.tagline, description: d.description, image: d.image || null, icon: d.icon, color: d.color,
        ctaLabel: d.ctaLabel.trim() || null, ctaHref: d.ctaHref.trim() || null,
      }
      const res = await fetch(editing ? `/api/services/programs/${editing.id}` : '/api/services/programs', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save')
      onSaved(json.data, json.message)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={() => !busy && onClose()} title={editing ? `Edit ${editing.name}` : 'Add programme'} size="xl">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="pg-name">Name</Label><Input id="pg-name" value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} placeholder="e.g. Health System" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-slug">Web address</Label>
            <Input id="pg-slug" value={d.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} placeholder={slugify(d.name) || 'health-system'} maxLength={60} />
            <p className="text-xs text-muted-foreground">/services/{slug || '…'}</p>
          </div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="pg-tag">Tagline</Label><Input id="pg-tag" value={d.tagline} onChange={(e) => set({ tagline: e.target.value })} maxLength={120} placeholder="Understand health. Protect life." /></div>
        <div className="space-y-1.5"><Label htmlFor="pg-desc">Description</Label><Textarea id="pg-desc" rows={3} value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={2000} /></div>
        <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">Sub-services (what members request, with call / messages / meeting and linked products) are added under the programme on the Services & Programs page.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Icon</Label><IconPicker value={d.icon} onChange={(icon) => set({ icon })} color={d.color} /></div>
          <div className="space-y-1.5"><Label>Colour</Label><ColorPicker value={d.color} onChange={(color) => set({ color })} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Photo <span className="font-normal text-muted-foreground">(optional — the icon shows without one)</span></Label>
          <CloudinaryUploadField id="pg-image" kind="image" accept="image/*" label={d.image ? 'Change photo' : 'Upload photo'} value={d.image} onUploaded={(r) => set({ image: r.url })} onClear={() => set({ image: '' })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="pg-cta">Button text</Label><Input id="pg-cta" value={d.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} maxLength={60} placeholder="e.g. Shop beauty products" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="pg-href">Button opens</Label>
            <Input id="pg-href" value={d.ctaHref} onChange={(e) => set({ ctaHref: e.target.value })} maxLength={300} placeholder="/shop or /member/care/counseling" />
            <p className="text-xs text-muted-foreground">Member pages ask guests to sign in first.</p>
          </div>
        </div>
        {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || d.name.trim().length < 2 || d.tagline.trim().length < 2 || d.description.trim().length < 10}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
