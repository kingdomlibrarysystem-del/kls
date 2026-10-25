'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, EyeOff, Eye } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { KLP_FORMATS } from '@/lib/klp-code'
import type { CollectionOption } from '@/lib/data/klp-register'

interface Props {
  initialCollections: CollectionOption[]
  /** Admin or library:approve — everyone else on staff can only look. */
  canManage: boolean
}

type Draft = { code: string; name: string; description: string }

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong — please try again')
  return json
}

/**
 * Admin list of KLP collections. 01–30 come from the Kingdom Library
 * Publication Code document; new ones take a free code from 31–99. A code
 * can't be renumbered (it is printed inside existing KLP codes), and a used
 * collection is deactivated rather than deleted.
 */
export function CollectionsView({ initialCollections, canManage }: Props) {
  const [items, setItems] = useState(initialCollections)
  const [editing, setEditing] = useState<CollectionOption | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>({ code: '', name: '', description: '' })
  const [deleting, setDeleting] = useState<CollectionOption | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }
  const nextFreeCode = () => {
    const used = new Set(items.map((c) => c.code))
    for (let n = 31; n <= 99; n++) { const code = String(n); if (!used.has(code)) return code }
    return ''
  }
  const upsert = (c: CollectionOption) => setItems((list) => {
    const next = list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]
    return next.sort((a, b) => a.code.localeCompare(b.code))
  })

  const openNew = () => { setDraft({ code: nextFreeCode(), name: '', description: '' }); setError(''); setEditing('new') }
  const openEdit = (c: CollectionOption) => { setDraft({ code: c.code, name: c.name, description: c.description ?? '' }); setError(''); setEditing(c) }

  const save = async () => {
    setBusy(true); setError('')
    try {
      if (editing === 'new') {
        const json = await send('/api/klp-collections', 'POST', { code: draft.code.trim(), name: draft.name.trim(), description: draft.description.trim() || undefined })
        upsert(json.data); showToast(json.message)
      } else if (editing) {
        const json = await send(`/api/klp-collections/${editing.id}`, 'PATCH', { name: draft.name.trim(), description: draft.description.trim() || null })
        upsert(json.data); showToast(json.message)
      }
      setEditing(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') } finally { setBusy(false) }
  }

  const toggleActive = async (c: CollectionOption) => {
    try {
      const json = await send(`/api/klp-collections/${c.id}`, 'PATCH', { active: !c.active })
      upsert(json.data); showToast(c.active ? `${c.code} hidden from the pickers` : `${c.code} available again`)
    } catch (e) { showToast(e instanceof Error ? e.message : 'Could not update') }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true); setError('')
    try {
      const json = await send(`/api/klp-collections/${deleting.id}`, 'DELETE')
      setItems((list) => list.filter((x) => x.id !== deleting.id)); showToast(json.message); setDeleting(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete') } finally { setBusy(false) }
  }

  const columns: Column<CollectionOption>[] = [
    { key: 'code', label: 'Code', sortable: true, render: (c) => <span className="font-mono text-sm font-semibold text-foreground">{c.code}</span> },
    {
      key: 'name',
      label: 'Collection',
      sortable: true,
      render: (c) => (
        <div>
          <p className="flex items-center gap-2 font-semibold text-foreground">{c.name}{!c.active && <Badge variant="secondary">Hidden</Badge>}</p>
          {c.description && <p className="max-w-md text-xs text-muted-foreground">{c.description}</p>}
        </div>
      ),
    },
    { key: 'usage', label: 'Resources', sortable: true, render: (c) => <span className="font-semibold text-foreground" suppressHydrationWarning>{(c.usage ?? 0).toLocaleString()}</span> },
    ...(canManage ? [{
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (c: CollectionOption) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}><Pencil /> Edit</Button>
          <Button variant="outline" size="sm" onClick={() => toggleActive(c)} aria-label={c.active ? `Hide ${c.name}` : `Show ${c.name}`}>
            {c.active ? <><EyeOff /> Hide</> : <><Eye /> Show</>}
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={(c.usage ?? 0) > 0}
            title={(c.usage ?? 0) > 0 ? 'Used by resources — hide it instead' : undefined}
            onClick={() => { setError(''); setDeleting(c) }}
            aria-label={`Delete ${c.name}`}
            className="text-destructive hover:text-destructive"
          ><Trash2 /> Delete</Button>
        </div>
      ),
    } as Column<CollectionOption>] : []),
  ]

  return (
    <div className="space-y-4">
      {toast && (
        <div role="status" className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" /> {toast}
        </div>
      )}

      <div className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground shadow-xs md:grid-cols-2">
        <div>
          <p className="font-semibold text-foreground">KLP Code · <span className="font-mono">KLP-SS-YY-NNN-EE-F</span></p>
          <p className="mt-1 text-muted-foreground">Collection, year, publication number (from the register, never reused), edition and format. Example <span className="font-mono text-foreground">KLP-09-26-001-01-P</span>.</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Kingdom Library ID · <span className="font-mono">KK SS YY NNN EE F C</span></p>
          <p className="mt-1 text-muted-foreground">13 digits starting 10, with a check digit. Example <span className="font-mono text-foreground">10 09 26 001 01 1 7</span>. It is <strong>not</strong> an ISBN — official ISBNs come only from the ISBN agency.</p>
        </div>
        <p className="text-xs text-muted-foreground md:col-span-2">
          Formats: {KLP_FORMATS.map((f) => `${f.letter} ${f.label} (${f.digit})`).join(' · ')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">Codes are assigned automatically when a resource is approved. Pick the collection on each resource; new collections use a free code from 31–99.</p>
        {canManage && <Button onClick={openNew}><Plus /> Add Collection</Button>}
      </div>

      <DataTable<CollectionOption>
        data={items}
        columns={columns}
        rowKey={(c) => c.id}
        searchPlaceholder="Search collections..."
        searchFilter={(c, q) => c.name.toLowerCase().includes(q) || c.code.includes(q)}
        emptyMessage="No collections found."
      />

      <Modal open={!!editing} onClose={() => !busy && setEditing(null)} title={editing === 'new' ? 'Add Collection' : 'Edit Collection'} size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="col-code">Code</Label>
            <Input id="col-code" inputMode="numeric" maxLength={2} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.replace(/\D/g, '') })} disabled={editing !== 'new'} />
            {editing !== 'new' && <p className="text-xs text-muted-foreground">The code can&apos;t change — it is part of the KLP codes already issued.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Name</Label>
            <Input id="col-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Music & Worship" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="col-desc">Description (optional)</Label>
            <Textarea id="col-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy || draft.name.trim().length < 2 || !/^\d{2}$/.test(draft.code)}>{busy ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => !busy && setDeleting(null)} title="Delete Collection" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Delete <span className="font-semibold text-foreground">{deleting?.code} · {deleting?.name}</span>? Only an unused collection can be deleted.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
