'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, Link2, Loader2, Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import type { CounselorItem } from '@/lib/care/data'

const selectCls = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

type Draft = { name: string; specialty: string; bio: string; image: string; userId: string; languages: string; availability: string; active: boolean }
const toDraft = (c: CounselorItem | null): Draft => ({
  name: c?.name ?? '', specialty: c?.specialty ?? '', bio: c?.bio ?? '', image: c?.image ?? '', userId: c?.userId ?? '',
  languages: (c?.languages ?? []).join(', '), availability: c?.availability ?? '', active: c?.active ?? true,
})

/** Counselor management for staff: add / edit / link to a staff account / hide / delete. */
export function CounselorsManageView({ initialCounselors, staffOptions }: { initialCounselors: CounselorItem[]; staffOptions: { id: string; label: string }[] }) {
  const [rows, setRows] = useState(initialCounselors)
  const [form, setForm] = useState<{ editing: CounselorItem | null; draft: Draft } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 4000) }
  const staffName = (id: string | null) => staffOptions.find((s) => s.id === id)?.label.split(' — ')[0]

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong')
    return json
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    const d = form.draft
    if (d.name.trim().length < 2) return setError('Enter the counselor’s name')
    if (d.specialty.trim().length < 2) return setError('Enter what they help with')
    setBusy(true)
    setError('')
    try {
      const body = {
        name: d.name.trim(), specialty: d.specialty.trim(), bio: d.bio.trim() || null, image: d.image, userId: d.userId || null,
        languages: d.languages.split(',').map((x) => x.trim()).filter(Boolean), availability: d.availability.trim() || null, active: d.active,
      }
      const json = form.editing ? await call(`/api/counseling/counselors/${form.editing.id}`, 'PATCH', body) : await call('/api/counseling/counselors', 'POST', body)
      setRows((list) => form.editing ? list.map((c) => (c.id === json.data.id ? json.data : c)) : [...list, json.data])
      flash(true, form.editing ? 'Counselor saved' : `${json.data.name} added — members can book them now`)
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (c: CounselorItem, active: boolean) => {
    try {
      const json = await call(`/api/counseling/counselors/${c.id}`, 'PATCH', { active })
      setRows((list) => list.map((x) => (x.id === c.id ? json.data : x)))
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const remove = async (c: CounselorItem) => {
    if (!window.confirm(`Delete ${c.name}? If they have past sessions they will be hidden instead.`)) return
    try {
      const json = await call(`/api/counseling/counselors/${c.id}`, 'DELETE')
      setRows((list) => json.data.hidden ? list.map((x) => (x.id === c.id ? { ...x, active: false } : x)) : list.filter((x) => x.id !== c.id))
      flash(true, json.message)
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const columns: Column<CounselorItem>[] = [
    {
      key: 'name', label: 'Counselor', sortable: true,
      render: (c) => (
        <div className="flex min-w-[200px] items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted"><RemoteImage src={c.image} alt="" fill sizes="40px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><UserRound className="size-4" /></div>} /></div>
          <div><p className="font-semibold text-foreground">{c.name}</p><p className="text-xs text-primary">{c.specialty}</p></div>
        </div>
      ),
    },
    { key: 'languages', label: 'Languages', render: (c) => <span className="text-sm text-muted-foreground">{c.languages.join(', ') || '—'}</span> },
    { key: 'userId', label: 'Staff account', render: (c) => c.userId ? <span className="inline-flex items-center gap-1 text-sm text-foreground"><Link2 className="size-3.5 text-success" /> {staffName(c.userId) ?? 'Linked'}</span> : <span className="text-xs text-warning">Not linked — members can’t message</span> },
    { key: 'active', label: 'Taking bookings', render: (c) => <div className="flex items-center gap-2"><Switch checked={c.active} onCheckedChange={(on) => toggle(c, on)} aria-label={`${c.name} takes bookings`} />{!c.active && <Badge variant="outline">Hidden</Badge>}</div> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setError(''); setForm({ editing: c, draft: toDraft(c) }) }}><Pencil /> Edit</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 /></Button>
        </div>
      ),
    },
  ]

  const d = form?.draft
  const setD = (patch: Partial<Draft>) => setForm((f) => (f ? { ...f, draft: { ...f.draft, ...patch } } : f))

  return (
    <div className="space-y-4">
      {toast && <p role="status" className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive')}>{toast.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />} {toast.text}</p>}
      <div className="flex justify-end"><Button onClick={() => { setError(''); setForm({ editing: null, draft: toDraft(null) }) }}><Plus /> Add counselor</Button></div>
      <DataTable<CounselorItem> data={rows} columns={columns} rowKey={(c) => c.id} searchPlaceholder="Search counselors…" searchFilter={(c, q) => `${c.name} ${c.specialty}`.toLowerCase().includes(q)} emptyMessage="No counselors yet — add the first one." />

      <Modal open={!!form} onClose={() => { if (!busy) setForm(null) }} title={form?.editing ? `Edit ${form.editing.name}` : 'Add counselor'} size="xl">
        {d && (
          <form onSubmit={save} className="space-y-4">
            {error && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
            <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
              <div className="relative size-24 overflow-hidden rounded-full bg-muted"><RemoteImage src={d.image} alt="" fill sizes="96px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><UserRound className="size-8" /></div>} /></div>
              <CloudinaryUploadField id="counselor-photo" kind="image" accept="image/*" label={d.image ? 'Change photo' : 'Upload photo'} value={d.image} onUploaded={(r) => setD({ image: r.url })} onClear={() => setD({ image: '' })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="c-name">Name</Label><Input id="c-name" value={d.name} onChange={(e) => setD({ name: e.target.value })} maxLength={120} autoFocus /></div>
              <div className="space-y-1.5"><Label htmlFor="c-spec">Helps with</Label><Input id="c-spec" value={d.specialty} onChange={(e) => setD({ specialty: e.target.value })} maxLength={120} placeholder="e.g. Family & marriage, Grief, Addiction" /></div>
              <div className="space-y-1.5"><Label htmlFor="c-lang">Languages <span className="font-normal text-muted-foreground">(comma separated)</span></Label><Input id="c-lang" value={d.languages} onChange={(e) => setD({ languages: e.target.value })} placeholder="Kinyarwanda, English, French" /></div>
              <div className="space-y-1.5"><Label htmlFor="c-avail">Usually available</Label><Input id="c-avail" value={d.availability} onChange={(e) => setD({ availability: e.target.value })} maxLength={300} placeholder="Mon–Fri 9:00–17:00, Sat mornings" /></div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c-user">Staff account <span className="font-normal text-muted-foreground">(lets members message them; they get booking notifications)</span></Label>
                <select id="c-user" value={d.userId} onChange={(e) => setD({ userId: e.target.value })} className={selectCls}>
                  <option value="">Not linked</option>
                  {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="c-bio">About</Label><Textarea id="c-bio" value={d.bio} onChange={(e) => setD({ bio: e.target.value })} rows={3} maxLength={2000} placeholder="Background and approach, in a warm sentence or two." /></div>
            </div>
            <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm"><span>Taking bookings</span><Switch checked={d.active} onCheckedChange={(on) => setD({ active: on })} /></label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
