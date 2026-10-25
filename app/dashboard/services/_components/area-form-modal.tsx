'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LifeAreaItem } from '@/lib/services/shared'
import { ColorPicker, IconPicker } from './pickers'

/** Add / edit a life area ("Life Cycle" step). Order is set with the number field. */
export function AreaFormModal({ editing, onClose, onSaved }: { editing: LifeAreaItem | null; onClose: () => void; onSaved: (a: LifeAreaItem, message: string) => void }) {
  const [d, setD] = useState({ name: editing?.name ?? '', description: editing?.description ?? '', icon: editing?.icon ?? 'sparkles', color: editing?.color ?? 'gold', sortOrder: editing?.sortOrder ?? 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }))

  const save = async () => {
    setBusy(true); setError('')
    try {
      const body = { name: d.name, description: d.description, icon: d.icon, color: d.color, ...(editing && { sortOrder: d.sortOrder }) }
      const res = await fetch(editing ? `/api/services/areas/${editing.id}` : '/api/services/areas', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save')
      onSaved(json.data, json.message)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={() => !busy && onClose()} title={editing ? `Edit ${editing.name}` : 'Add life area'} size="md">
      <div className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="la-name">Name</Label><Input id="la-name" value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} placeholder="e.g. Restoration" /></div>
        <div className="space-y-1.5"><Label htmlFor="la-desc">Short description</Label><Input id="la-desc" value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={200} placeholder="Recover, renew and realign." /></div>
        <div className="space-y-1.5"><Label>Icon</Label><IconPicker value={d.icon} onChange={(icon) => set({ icon })} color={d.color} /></div>
        <div className="space-y-1.5"><Label>Colour</Label><ColorPicker value={d.color} onChange={(color) => set({ color })} /></div>
        {editing && <div className="space-y-1.5"><Label htmlFor="la-order">Position (lower comes first)</Label><Input id="la-order" type="number" min={0} max={999} value={d.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) || 0 })} /></div>}
        {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || d.name.trim().length < 2 || d.description.trim().length < 2}>{busy ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
