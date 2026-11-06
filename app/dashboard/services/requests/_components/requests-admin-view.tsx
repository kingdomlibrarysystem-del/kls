'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarClock, CheckCircle2, ExternalLink, MessageSquare, Phone, XCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LocalDate } from '@/components/ui/local-date'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { ChannelIcon } from '@/components/services/channel-icon'
import type { ServiceRequestItem, ServiceRequestStatusCode } from '@/lib/services/shared'

type Filter = 'open' | ServiceRequestStatusCode | 'all'

const STATUS: Record<ServiceRequestStatusCode, { label: string; cls: string }> = {
  PENDING: { label: 'New', cls: 'border-primary/40 bg-primary/10 text-w-900 dark:text-primary' },
  SCHEDULED: { label: 'Scheduled', cls: 'border-success/30 bg-success/10 text-success' },
  COMPLETED: { label: 'Completed', cls: 'border-border bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Cancelled', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
}
const CHANNEL = { CALL: 'Phone call', MESSAGE: 'Messages', MEETING: 'Online meeting' } as const

/** A Date as the value of a datetime-local input, in the browser's time zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/**
 * Requests list (open first) and a dialog per request: contact details, the
 * member's note, then Schedule (time, meeting link for online meetings, note
 * to the member), Message / Call, Complete, or Cancel with a reason. The
 * member is notified each time.
 */
export function RequestsAdminView({ initialRequests, initialOpenId }: { initialRequests: ServiceRequestItem[]; initialOpenId?: string }) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<Filter>('open')
  const [open, setOpen] = useState<ServiceRequestItem | null>(() => initialRequests.find((r) => r.id === initialOpenId) ?? null)
  const [form, setForm] = useState(() => {
    const r = initialRequests.find((x) => x.id === initialOpenId)
    return { when: toLocalInput(r?.scheduledAt ?? r?.preferredAt ?? null), link: r?.meetingLink ?? '', note: r?.staffNote ?? '', reason: '' }
  })
  const [mode, setMode] = useState<'view' | 'cancel'>('view')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const counts = {
    open: requests.filter((r) => r.status === 'PENDING' || r.status === 'SCHEDULED').length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    SCHEDULED: requests.filter((r) => r.status === 'SCHEDULED').length,
    COMPLETED: requests.filter((r) => r.status === 'COMPLETED').length,
    CANCELLED: requests.filter((r) => r.status === 'CANCELLED').length,
    all: requests.length,
  }
  const shown = requests.filter((r) => filter === 'all' || (filter === 'open' ? r.status === 'PENDING' || r.status === 'SCHEDULED' : r.status === filter))

  const openRequest = (r: ServiceRequestItem) => {
    setError(''); setMode('view'); setOpen(r)
    setForm({ when: toLocalInput(r.scheduledAt ?? r.preferredAt), link: r.meetingLink ?? '', note: r.staffNote ?? '', reason: '' })
  }

  const act = async (body: Record<string, unknown>, label: string) => {
    if (!open) return
    setBusy(label); setError('')
    try {
      const res = await fetch(`/api/services/requests/${open.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not save')
      setRequests((l) => l.map((r) => (r.id === json.data.id ? json.data : r)))
      setOpen(null); setToast(json.message); setTimeout(() => setToast(''), 3500)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save') } finally { setBusy(null) }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'open', label: 'To handle' }, { key: 'PENDING', label: 'New' }, { key: 'SCHEDULED', label: 'Scheduled' },
    { key: 'COMPLETED', label: 'Completed' }, { key: 'CANCELLED', label: 'Cancelled' }, { key: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-4">
      {toast && <div role="status" className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"><CheckCircle2 className="size-4" /> {toast}</div>}

      <div role="tablist" aria-label="Filter requests" className="flex flex-wrap gap-1.5">
        {tabs.map((tb) => (
          <button key={tb.key} role="tab" aria-selected={filter === tb.key} onClick={() => setFilter(tb.key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${filter === tb.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>
            {tb.label} <span className="tabular-nums opacity-80">{counts[tb.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => openRequest(r)} className="flex h-full w-full flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/50">
                <div className="flex w-full items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ChannelIcon channel={r.channel} className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{r.userName ?? 'Member'} <span className="font-mono text-xs font-normal text-muted-foreground">{r.number}</span></span>
                    <span className="block text-sm text-muted-foreground">{r.programName}: {r.offeringNames.join(', ')}</span>
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                </div>
                <span className="line-clamp-2 text-sm text-foreground">{r.note}</span>
                <span className="text-xs text-muted-foreground">
                  {CHANNEL[r.channel]} · asked <LocalDate value={r.createdAt} />
                  {r.status === 'SCHEDULED' && r.scheduledAt && <> · <strong className="text-foreground">on <LocalDate value={r.scheduledAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} /></strong></>}
                  {r.status === 'PENDING' && r.preferredAt && <> · prefers <LocalDate value={r.preferredAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} /></>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!open} onClose={() => !busy && setOpen(null)} title={open ? `${open.number} · ${open.programName}` : ''} size="lg">
        {open && (
          <div className="space-y-4">
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Member</dt><dd className="font-medium text-foreground">{open.userName ?? '—'}{open.userEmail && <span className="block text-xs font-normal text-muted-foreground">{open.userEmail}</span>}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Wants</dt><dd className="flex items-center gap-1.5 font-medium text-foreground"><ChannelIcon channel={open.channel} className="size-4 text-primary" /> {CHANNEL[open.channel]}{open.phone && <span className="font-normal"> · {open.phone}</span>}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Sub-services</dt><dd className="text-foreground">{open.offeringNames.join(' · ')}</dd></div>
              {open.preferredAt && <div><dt className="text-xs text-muted-foreground">Preferred time</dt><dd className="text-foreground"><LocalDate value={open.preferredAt} mode="datetime" options={{ dateStyle: 'full', timeStyle: 'short' }} /></dd></div>}
              <div><dt className="text-xs text-muted-foreground">Status</dt><dd><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS[open.status].cls}`}>{STATUS[open.status].label}</span></dd></div>
            </dl>
            <p className="whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm text-foreground">{open.note}</p>
            {open.cancelReason && <p className="text-sm text-destructive">Cancelled: {open.cancelReason}</p>}

            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/messages?to=${open.userId}`} className={buttonVariants({ variant: open.channel === 'MESSAGE' ? 'default' : 'outline', size: 'sm' })}><MessageSquare /> Message member</Link>
              {open.phone && <a href={`tel:${open.phone}`} className={buttonVariants({ variant: open.channel === 'CALL' ? 'default' : 'outline', size: 'sm' })}><Phone /> Call {open.phone}</a>}
              {open.meetingLink && <a href={open.meetingLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}><ExternalLink /> Open meeting</a>}
            </div>

            {(open.status === 'PENDING' || open.status === 'SCHEDULED') && (mode === 'view' ? (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><CalendarClock className="size-4 text-primary" /> {open.status === 'SCHEDULED' ? 'Change the time' : 'Schedule it'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="rq-when">Date &amp; time</Label><Input id="rq-when" type="datetime-local" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} /></div>
                  {open.channel === 'MEETING' && <div className="space-y-1.5"><Label htmlFor="rq-link">Meeting link</Label><Input id="rq-link" type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://meet.google.com/…" /></div>}
                </div>
                <div className="space-y-1.5"><Label htmlFor="rq-note">Note to the member <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="rq-note" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={1000} /></div>
                {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setError(''); setMode('cancel') }} disabled={!!busy}><XCircle /> Cancel request</Button>
                  <Button variant="outline" onClick={() => act({ action: 'complete', staffNote: form.note || null }, 'complete')} disabled={!!busy}><CheckCircle2 /> {busy === 'complete' ? 'Saving…' : 'Mark completed'}</Button>
                  <Button onClick={() => act({ action: 'schedule', scheduledAt: new Date(form.when).toISOString(), meetingLink: form.link || null, staffNote: form.note || null }, 'schedule')}
                    disabled={!!busy || !form.when || (open.channel === 'MEETING' && !form.link)}>
                    {busy === 'schedule' ? 'Saving…' : open.status === 'SCHEDULED' ? 'Update & notify' : 'Schedule & notify'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-destructive/30 p-4">
                <Label htmlFor="rq-reason">Why is it cancelled? The member will see this.</Label>
                <Textarea id="rq-reason" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={500} />
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMode('view')} disabled={!!busy}>Back</Button>
                  <Button variant="destructive" onClick={() => act({ action: 'cancel', reason: form.reason }, 'cancel')} disabled={!!busy || form.reason.trim().length < 3}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel request'}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
