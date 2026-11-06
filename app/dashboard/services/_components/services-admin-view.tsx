'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, ExternalLink, Inbox, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Switch } from '@/components/ui/switch'
import { serviceColor, type LifeAreaItem, type ServiceOfferingItem, type ServiceProgramItem } from '@/lib/services/shared'
import type { ShopCategory, ShopProduct } from '@/lib/shop/shared'
import { ServiceIcon } from '@/components/services/service-icon'
import { ChannelIcon } from '@/components/services/channel-icon'
import { ProgramFormModal } from './program-form-modal'
import { AreaFormModal } from './area-form-modal'
import { OfferingFormModal } from './offering-form-modal'

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong — please try again')
  return json
}

const bySort = <T extends { sortOrder: number; name: string }>(a: T, b: T) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)

type Deleting = { kind: 'program' | 'area' | 'offering'; id: string; name: string; programId?: string }

interface Props {
  initialPrograms: ServiceProgramItem[]
  initialAreas: LifeAreaItem[]
  /** Shop products that can be linked to a sub-service. */
  products: ShopProduct[]
  /** Open service requests, for the badge on "Requests". */
  openRequests: number
  /** Shop categories; those linked to a programme show under it. */
  categories: ShopCategory[]
}

/**
 * Programmes with their sub-services (each with its ways to help and linked
 * shop products), and the life areas. Show/hide is instant and reversible;
 * delete asks first. Changes appear on the public pages at once.
 */
export function ServicesAdminView({ initialPrograms, initialAreas, products, openRequests, categories }: Props) {
  const [programs, setPrograms] = useState(initialPrograms)
  const [areas, setAreas] = useState(initialAreas)
  const [editingProgram, setEditingProgram] = useState<ServiceProgramItem | 'new' | null>(null)
  const [editingArea, setEditingArea] = useState<LifeAreaItem | 'new' | null>(null)
  const [editingOffering, setEditingOffering] = useState<{ program: ServiceProgramItem; offering: ServiceOfferingItem | null } | null>(null)
  const [deleting, setDeleting] = useState<Deleting | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)

  const flash = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 3500) }
  // The programme API doesn't return sub-services — keep the ones already on the page.
  const upsertProgram = (p: ServiceProgramItem) => setPrograms((l) => {
    const prev = l.find((x) => x.id === p.id)
    const next = { ...p, offerings: prev?.offerings ?? [] }
    return (prev ? l.map((x) => (x.id === p.id ? next : x)) : [...l, next]).sort(bySort)
  })
  const upsertArea = (a: LifeAreaItem) => setAreas((l) => (l.some((x) => x.id === a.id) ? l.map((x) => (x.id === a.id ? a : x)) : [...l, a]).sort(bySort))
  const upsertOffering = (o: ServiceOfferingItem) => setPrograms((l) => l.map((p) => (p.id !== o.programId ? p : {
    ...p,
    offerings: (p.offerings.some((x) => x.id === o.id) ? p.offerings.map((x) => (x.id === o.id ? o : x)) : [...p.offerings, o]).sort(bySort),
  })))

  const toggleProgram = async (p: ServiceProgramItem, active: boolean) => {
    try { upsertProgram((await send(`/api/services/programs/${p.id}`, 'PATCH', { active })).data); flash(true, active ? `${p.name} is visible` : `${p.name} is hidden`) }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
  }
  const toggleArea = async (a: LifeAreaItem, active: boolean) => {
    try { upsertArea((await send(`/api/services/areas/${a.id}`, 'PATCH', { active })).data); flash(true, active ? `${a.name} is visible` : `${a.name} is hidden`) }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
  }
  const toggleOffering = async (o: ServiceOfferingItem, active: boolean) => {
    try { upsertOffering((await send(`/api/services/offerings/${o.id}`, 'PATCH', { active })).data); flash(true, active ? `${o.name} is visible` : `${o.name} is hidden`) }
    catch (e) { flash(false, e instanceof Error ? e.message : 'Could not save') }
  }

  const remove = async () => {
    if (!deleting) return
    setBusy(true); setError('')
    try {
      const path = { program: 'programs', area: 'areas', offering: 'offerings' }[deleting.kind]
      const json = await send(`/api/services/${path}/${deleting.id}`, 'DELETE')
      if (deleting.kind === 'program') setPrograms((l) => l.filter((x) => x.id !== deleting.id))
      else if (deleting.kind === 'area') setAreas((l) => l.filter((x) => x.id !== deleting.id))
      else setPrograms((l) => l.map((p) => (p.id === deleting.programId ? { ...p, offerings: p.offerings.filter((o) => o.id !== deleting.id) } : p)))
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
            <h2 className="font-semibold text-foreground">Programmes &amp; sub-services</h2>
            <p className="text-sm text-muted-foreground">Programmes are the cards on the Services page, home page and header menu. Sub-services are what members request — by phone call, messages or online meeting.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/services/requests" className={buttonVariants({ variant: 'outline' })}>
              <Inbox /> Requests {openRequests > 0 && <Badge>{openRequests}</Badge>}
            </Link>
            <Link href="/services" target="_blank" className={buttonVariants({ variant: 'outline' })}><ExternalLink /> View page</Link>
            <Button onClick={() => setEditingProgram('new')}><Plus /> Add programme</Button>
          </div>
        </div>

        <div className="space-y-4">
          {programs.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="flex flex-wrap items-start gap-3 p-4">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${serviceColor(p.color).solid}`}><ServiceIcon name={p.icon} className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">{p.name}{!p.active && <Badge variant="outline">Hidden</Badge>}</p>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-1 text-xs text-muted-foreground">/services/{p.slug}{p.ctaHref ? ` · main button → ${p.ctaHref}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProgram(p)}><Pencil /> Edit</Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => { setError(''); setDeleting({ kind: 'program', id: p.id, name: p.name }) }} aria-label={`Delete ${p.name}`}><Trash2 /></Button>
                  <Switch checked={p.active} onCheckedChange={(on) => toggleProgram(p, on)} aria-label={`Show ${p.name}`} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 text-sm">
                <ShoppingBag className="size-4 text-primary" aria-hidden />
                <span className="font-semibold text-foreground">Shop categories:</span>
                {categories.filter((c) => c.serviceProgramId === p.id).length === 0
                  ? <span className="text-muted-foreground">none — its pages show only products picked on sub-services.</span>
                  : categories.filter((c) => c.serviceProgramId === p.id).map((c) => (
                    <Badge key={c.id} variant={c.active ? 'secondary' : 'outline'}>{c.name} · {c.productCount ?? 0}{c.active ? '' : ' (hidden)'}</Badge>
                  ))}
                <Link href="/dashboard/beauty/shop/categories" className="ml-auto text-sm font-medium text-primary hover:underline">Link a category</Link>
              </div>

              <div className="border-t border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Sub-services ({p.offerings.length})</p>
                  <Button size="sm" variant="outline" onClick={() => setEditingOffering({ program: p, offering: null })}><Plus /> Add sub-service</Button>
                </div>
                {p.offerings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet — add what members can ask for in this programme.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border bg-card">
                    {p.offerings.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">{o.name}{!o.active && <Badge variant="outline">Hidden</Badge>}</p>
                          <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                            {o.channels.map((c) => <span key={c} className="inline-flex items-center gap-1"><ChannelIcon channel={c} className="size-3" />{c === 'CALL' ? 'Call' : c === 'MESSAGE' ? 'Messages' : 'Meeting'}</span>)}
                            {o.productIds.length > 0 && <span className="inline-flex items-center gap-1"><ShoppingBag className="size-3" />{o.productIds.length} product{o.productIds.length === 1 ? '' : 's'}</span>}
                            {o.priceNote && <span>{o.priceNote}</span>}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditingOffering({ program: p, offering: o })} aria-label={`Edit ${o.name}`}><Pencil /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => { setError(''); setDeleting({ kind: 'offering', id: o.id, name: o.name, programId: p.id }) }} aria-label={`Delete ${o.name}`}><Trash2 /></Button>
                        <Switch checked={o.active} onCheckedChange={(on) => toggleOffering(o, on)} aria-label={`Show ${o.name}`} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
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
          {areas.map((a, i) => (
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
          ))}
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
      {editingOffering && (
        <OfferingFormModal
          key={editingOffering.offering?.id ?? `new-${editingOffering.program.id}`}
          program={editingOffering.program}
          editing={editingOffering.offering}
          products={products}
          onClose={() => setEditingOffering(null)}
          onSaved={(o, msg) => { upsertOffering(o); setEditingOffering(null); flash(true, msg) }}
        />
      )}

      <Modal open={!!deleting} onClose={() => !busy && setDeleting(null)} title="Delete" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Delete <span className="font-semibold text-foreground">{deleting?.name}</span> for good? To keep it but take it off the site, switch it off instead.{deleting?.kind === 'offering' && ' Past requests keep its name.'}</p>
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
