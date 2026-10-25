'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Archive, BookOpen, CheckCircle2, Headphones, Loader2, Pencil, PlayCircle, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { CloudinaryUploadField } from '@/components/ui/cloudinary-upload-field'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { cn } from '@/lib/utils'
import type { CareKind, CareProgram, CareResourceItem } from '@/lib/care/data'

const selectCls = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
const KIND: Record<CareKind, { label: string; icon: typeof BookOpen }> = { ARTICLE: { label: 'Reading', icon: BookOpen }, AUDIO: { label: 'Audio', icon: Headphones }, VIDEO: { label: 'Video', icon: PlayCircle } }
const PROGRAM: Record<CareProgram, string> = { COUNSELING: 'Counseling', REHABILITATION: 'Recovery', GENERAL: 'Wellbeing (both)' }

type Draft = { program: CareProgram; kind: CareKind; title: string; summary: string; body: string; mediaUrl: string; coverImage: string; topic: string; durationMins: string; published: boolean }
const toDraft = (r: CareResourceItem | null): Draft => ({
  program: r?.program ?? 'GENERAL', kind: r?.kind ?? 'ARTICLE', title: r?.title ?? '', summary: r?.summary ?? '', body: r?.body ?? '',
  mediaUrl: r?.mediaUrl ?? '', coverImage: r?.coverImage ?? '', topic: r?.topic ?? '', durationMins: r?.durationMins ? String(r.durationMins) : '', published: r?.published ?? true,
})

/** Staff management of care resources: write a reading, upload audio/video (or paste a YouTube link), publish, Trash/restore. */
export function CareResourcesView({ initialResources }: { initialResources: CareResourceItem[] }) {
  const [rows, setRows] = useState(initialResources)
  const [tab, setTab] = useState<'live' | 'trash'>('live')
  const [form, setForm] = useState<{ editing: CareResourceItem | null; draft: Draft } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 4000) }

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
    if (d.title.trim().length < 3) return setError('Give it a title')
    if (d.summary.trim().length < 10) return setError('Write a short summary (at least 10 characters)')
    if (d.topic.trim().length < 2) return setError('Add a topic, e.g. Anxiety')
    if (d.kind === 'ARTICLE' && d.body.trim().length < 50) return setError('Write the reading (at least 50 characters)')
    if (d.kind !== 'ARTICLE' && !d.mediaUrl) return setError(`Upload the ${d.kind === 'AUDIO' ? 'audio' : 'video'} or paste a link`)
    setBusy('save')
    setError('')
    try {
      const body = {
        program: d.program, kind: d.kind, title: d.title.trim(), summary: d.summary.trim(), body: d.body.trim() || null, mediaUrl: d.mediaUrl || null,
        coverImage: d.coverImage || null, topic: d.topic.trim(), durationMins: d.durationMins ? Number(d.durationMins) : null, published: d.published,
      }
      const json = form.editing ? await call(`/api/care/resources/${form.editing.id}`, 'PATCH', body) : await call('/api/care/resources', 'POST', body)
      setRows((list) => form.editing ? list.map((r) => (r.id === json.data.id ? json.data : r)) : [json.data, ...list])
      flash(true, json.message)
      setForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const act = async (r: CareResourceItem, what: 'publish' | 'trash' | 'restore' | 'delete') => {
    if (what === 'delete' && !window.confirm(`Delete “${r.title}” permanently?`)) return
    setBusy(r.id)
    try {
      if (what === 'publish') {
        const json = await call(`/api/care/resources/${r.id}`, 'PATCH', { published: !r.published })
        setRows((list) => list.map((x) => (x.id === r.id ? json.data : x)))
      } else if (what === 'restore') {
        const json = await call(`/api/care/resources/${r.id}`, 'PATCH', { restore: true })
        setRows((list) => list.map((x) => (x.id === r.id ? json.data : x)))
      } else {
        const json = await call(`/api/care/resources/${r.id}${what === 'delete' ? '?permanent=1' : ''}`, 'DELETE')
        setRows((list) => (what === 'delete' ? list.filter((x) => x.id !== r.id) : list.map((x) => (x.id === r.id ? { ...x, inTrash: true } : x))))
        flash(true, json.message)
      }
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const columns: Column<CareResourceItem>[] = [
    {
      key: 'title', label: 'Resource', sortable: true,
      render: (r) => {
        const K = KIND[r.kind]
        return (
          <div className="flex min-w-[240px] items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><K.icon className="size-4" /></span>
            <div><p className="font-semibold text-foreground">{r.title}</p><p className="line-clamp-1 text-xs text-muted-foreground">{r.summary}</p></div>
          </div>
        )
      },
    },
    { key: 'program', label: 'For', sortable: true, render: (r) => <span className="text-sm">{PROGRAM[r.program]}</span> },
    { key: 'topic', label: 'Topic', sortable: true, render: (r) => <span className="text-sm text-muted-foreground">{r.topic}</span> },
    { key: 'views', label: 'Opened', sortable: true, render: (r) => <span className="tabular-nums text-muted-foreground">{r.views}</span> },
    {
      key: 'published', label: 'Published',
      render: (r) => r.inTrash ? <Badge variant="outline">In Trash</Badge> : <Switch checked={r.published} disabled={busy === r.id} onCheckedChange={() => act(r, 'publish')} aria-label={`Publish ${r.title}`} />,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => r.inTrash ? (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => act(r, 'restore')}><RotateCcw /> Restore</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={busy === r.id} onClick={() => act(r, 'delete')}><Trash2 /> Delete permanently</Button>
        </div>
      ) : (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { setError(''); setForm({ editing: r, draft: toDraft(r) }) }}><Pencil /> Edit</Button>
          <Button variant="outline" size="sm" disabled={busy === r.id} onClick={() => act(r, 'trash')} aria-label={`Move ${r.title} to Trash`}><Archive /> Trash</Button>
        </div>
      ),
    },
  ]

  const d = form?.draft
  const setD = (patch: Partial<Draft>) => setForm((f) => (f ? { ...f, draft: { ...f.draft, ...patch } } : f))
  const live = rows.filter((r) => !r.inTrash)
  const trash = rows.filter((r) => r.inTrash)

  return (
    <div className="space-y-4">
      {toast && <p role="status" className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive')}>{toast.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />} {toast.text}</p>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex gap-1 border-b border-border" role="tablist">
          {(['live', 'trash'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-semibold', tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t === 'live' ? `Resources (${live.length})` : `Trash (${trash.length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Link href="/member/care/resources" target="_blank" className="self-center text-sm text-primary hover:underline">See what members see</Link>
          <Button onClick={() => { setError(''); setForm({ editing: null, draft: toDraft(null) }) }}><Plus /> Add resource</Button>
        </div>
      </div>
      <DataTable<CareResourceItem> data={tab === 'live' ? live : trash} columns={columns} rowKey={(r) => r.id} searchPlaceholder="Search…" searchFilter={(r, q) => `${r.title} ${r.topic} ${r.summary}`.toLowerCase().includes(q)} emptyMessage={tab === 'live' ? 'No resources yet — add a reading, audio or video.' : 'Trash is empty.'} />

      <Modal open={!!form} onClose={() => { if (!busy) setForm(null) }} title={form?.editing ? 'Edit resource' : 'Add resource'} size="4xl">
        {d && (
          <form onSubmit={save} className="space-y-4">
            {error && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5"><Label htmlFor="r-kind">Type</Label>
                <select id="r-kind" value={d.kind} onChange={(e) => setD({ kind: e.target.value as CareKind })} className={selectCls}>
                  {(Object.keys(KIND) as CareKind[]).map((k) => <option key={k} value={k}>{KIND[k].label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="r-program">For</Label>
                <select id="r-program" value={d.program} onChange={(e) => setD({ program: e.target.value as CareProgram })} className={selectCls}>
                  {(Object.keys(PROGRAM) as CareProgram[]).map((p) => <option key={p} value={p}>{PROGRAM[p]}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="r-topic">Topic</Label><Input id="r-topic" value={d.topic} onChange={(e) => setD({ topic: e.target.value })} maxLength={60} placeholder="e.g. Anxiety, Grief, Marriage" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="r-title">Title</Label><Input id="r-title" value={d.title} onChange={(e) => setD({ title: e.target.value })} maxLength={200} autoFocus /></div>
              <div className="space-y-1.5"><Label htmlFor="r-dur">Length (minutes)</Label><Input id="r-dur" type="number" min={1} value={d.durationMins} onChange={(e) => setD({ durationMins: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-3"><Label htmlFor="r-summary">Summary</Label><Textarea id="r-summary" value={d.summary} onChange={(e) => setD({ summary: e.target.value })} rows={2} maxLength={400} placeholder="One or two sentences shown on the card." /></div>
            </div>

            {d.kind !== 'ARTICLE' && (
              <div className="space-y-2">
                <Label>{d.kind === 'AUDIO' ? 'Audio' : 'Video'}</Label>
                <CloudinaryUploadField id="r-media" kind={d.kind === 'AUDIO' ? 'audio' : 'video'} accept={d.kind === 'AUDIO' ? 'audio/*' : 'video/*'} label={`Upload ${d.kind === 'AUDIO' ? 'audio' : 'video'}`} value={d.mediaUrl} onUploaded={(r) => setD({ mediaUrl: r.url })} onClear={() => setD({ mediaUrl: '' })} />
                {d.kind === 'VIDEO' && <Input value={d.mediaUrl} onChange={(e) => setD({ mediaUrl: e.target.value })} placeholder="…or paste a YouTube link" aria-label="Video link" />}
              </div>
            )}
            <div className="space-y-2">
              <Label>Cover image <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <CloudinaryUploadField id="r-cover" kind="image" accept="image/*" label="Upload cover image" value={d.coverImage} onUploaded={(r) => setD({ coverImage: r.url })} onClear={() => setD({ coverImage: '' })} />
            </div>
            <div className="space-y-1.5">
              <Label>{d.kind === 'ARTICLE' ? 'The reading' : 'Notes / transcript (optional)'}</Label>
              <MarkdownEditor value={d.body} onChange={(body: string) => setD({ body })} height={320} />
            </div>
            <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm"><span>Published (members can open it)</span><Switch checked={d.published} onCheckedChange={(on) => setD({ published: on })} /></label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={!!busy} onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" disabled={!!busy}>{busy === 'save' && <Loader2 className="animate-spin" />} Save</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
