'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Switch } from '@/components/ui/switch'
import { serviceColor, type LifeAreaItem, type ServiceProgramItem } from '@/lib/services/shared'
import { ServiceIcon } from '@/components/services/service-icon'
import { ProgramFormModal } from './program-form-modal'
import { AreaFormModal } from './area-form-modal'

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong — please try again')
  return json
}

const bySort = <T extends { sortOrder: number; name: string }>(a: T, b: T) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)

/**
 * Programmes (cards on /services, home page and the header "Services" menu)
 * and life areas (the numbered "Life Cycle"). Show/hide is instant and
 * reversible; delete asks first. Changes appear on the public pages at once.
 */
export function ServicesAdminView({ initialPrograms, initialAreas }: { initialPrograms: ServiceProgramItem[]; initialAreas: LifeAreaItem[] }) {
  const [programs, setPrograms] = useState(initialPrograms)
  const [areas, setAreas] = useState(initialAreas)
  const [editingProgram, setEditingProgram] = useState<ServiceProgramItem | 'new' | null>(null)
  const [editingArea, setEditingArea] = useState<LifeAreaItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<{ kind: 'program' | 'area'; id: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)

  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500) }
  const upsertProgram = (p: ServiceProgramItem) => setPrograms((l) => (l.some((x) => x.id === p.id) ? l.map((x) => (x.id === p.id ? p : x)) : [...l, p]).sort(bySort))
  const upsertArea = (a: LifeAreaItem) => setAreas((l) => (l.some((x) => x.id === a.id) ? l.map((x) => (x.id === a.id ? a : x)) : [...l, a]).sort(bySort))

  const toggleProgram = async (p: ServiceProgramItem, active: boolean) => {
    try { upsertProgram((await send(`/api/services/programs/${p.id}`, 'PATCH', { active })).data); flash(true, active ? `${p.name} is visible` : `${p.name} is hidden`) }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
  }
  const toggleArea = async (a: LifeAreaItem, active: boolean) => {
    try { upsertArea((await send(`/api/services/areas/${a.id}`, 'PATCH', { active })).data); flash(true, active ? `${a.name} is visible` : `${a.name} is hidden`) }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true); setError('')
    try {
      const json = await send(`/api/services/${deleting.kind === 'program' ? 'programs' : 'areas'}/${deleting.id}`, 'DELETE')
      if (deleting.kind === 'program') setPrograms((l) => l.filter((x) => x.id !== deleting.id))
      else setAreas((l) => l.filter((x) => x.id !== deleting.id))
      flash(true, json.message); setDeleting(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div role="status" className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${toast.ok ? 'border-success/30 bg-success/10 text-success' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}>
          {toast.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />} {toast.text}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-foreground">Programmes</h2>
            <p className="text-sm text-muted-foreground">Cards on the Services page and home page, and links in the header “Services” menu.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/services" target="_blank" className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><ExternalLink className="size-4" /> View page</Link>
            <Button onClick={() => setEditingProgram('new')}><Plus /> Add programme</Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {programs.map((p) => {
            return (
              <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${serviceColor(p.color).solid}`}><ServiceIcon name={p.icon} className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">{p.name}{!p.active && <Badge variant="outline">Hidden</Badge>}</p>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-1 text-xs text-muted-foreground">/services/{p.slug} · {p.keyServices.length} key services{p.ctaHref ? ` · button → ${p.ctaHref}` : ''}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingProgram(p)}><Pencil /> Edit</Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setError(''); setDeleting({ kind: 'program', id: p.id, name: p.name }) }}><Trash2 /> Delete</Button>
                  </div>
                </div>
                <Switch checked={p.active} onCheckedChange={(on) => toggleProgram(p, on)} aria-label={`Show ${p.name}`} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-foreground">Life areas</h2>
            <p className="text-sm text-muted-foreground">The numbered “Life Cycle”, in this order. Each programme card says it supports all visible areas.</p>
          </div>
          <Button onClick={() => setEditingArea('new')}><Plus /> Add life area</Button>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a, i) => {
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${serviceColor(a.color).solid}`}><ServiceIcon name={a.icon} className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{i + 1}. {a.name} {!a.active && <Badge variant="outline">Hidden</Badge>}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setEditingArea(a)} aria-label={`Edit ${a.name}`}><Pencil /></Button>
                <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => { setError(''); setDeleting({ kind: 'area', id: a.id, name: a.name }) }} aria-label={`Delete ${a.name}`}><Trash2 /></Button>
                <Switch checked={a.active} onCheckedChange={(on) => toggleArea(a, on)} aria-label={`Show ${a.name}`} />
              </li>
            )
          })}
        </ol>
      </section>

      {editingProgram && (
        <ProgramFormModal
          key={editingProgram === 'new' ? 'new' : editingProgram.id}
          editing={editingProgram === 'new' ? null : editingProgram}
          onClose={() => setEditingProgram(null)}
          onSaved={(p, msg) => { upsertProgram(p); setEditingProgram(null); flash(true, msg) }}
        />
      )}
      {editingArea && (
        <AreaFormModal
          key={editingArea === 'new' ? 'new' : editingArea.id}
          editing={editingArea === 'new' ? null : editingArea}
          onClose={() => setEditingArea(null)}
          onSaved={(a, msg) => { upsertArea(a); setEditingArea(null); flash(true, msg) }}
        />
      )}

      <Modal open={!!deleting} onClose={() => !busy && setDeleting(null)} title="Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Delete <span className="font-semibold text-foreground">{deleting?.name}</span> for good? To keep it but take it off the site, switch it off instead.</p>
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
