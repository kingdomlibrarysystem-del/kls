'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarClock, ExternalLink, Inbox, MessageSquare, Phone } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LocalDate } from '@/components/ui/local-date'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/language-context'
import { ChannelIcon } from '@/components/services/channel-icon'
import type { ServiceRequestItem, ServiceRequestStatusCode } from '@/lib/services/shared'

const STATUS_CLS: Record<ServiceRequestStatusCode, string> = {
  PENDING: 'border-primary/40 bg-primary/10 text-w-900 dark:text-primary',
  SCHEDULED: 'border-success/30 bg-success/10 text-success',
  COMPLETED: 'border-border bg-muted text-muted-foreground',
  CANCELLED: 'border-destructive/30 bg-destructive/10 text-destructive',
}

/** The member's requests: status, when we will talk, join / message / call details, and cancel while open. */
export function MyRequestsView({ initialRequests }: { initialRequests: ServiceRequestItem[] }) {
  const { t } = useLanguage()
  const [requests, setRequests] = useState(initialRequests)
  const [cancelling, setCancelling] = useState<ServiceRequestItem | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const cancel = async () => {
    if (!cancelling) return
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/services/requests/${cancelling.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', reason: reason.trim() }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not cancel')
      setRequests((list) => list.map((r) => (r.id === json.data.id ? json.data : r)))
      setCancelling(null); setReason('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not cancel') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-foreground">{t('services.requests_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('services.requests_sub')}</p>
        </div>
        <Link href="/member/services" className={buttonVariants({ variant: 'outline' })}>{t('services.browse_services')}</Link>
      </header>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <Inbox className="size-9 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{t('services.requests_empty')}</p>
          <Link href="/member/services" className={buttonVariants()}>{t('services.browse_services')}</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const open = r.status === 'PENDING' || r.status === 'SCHEDULED'
            return (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ChannelIcon channel={r.channel} className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {r.programSlug ? <Link href={`/member/services/${r.programSlug}`} className="hover:text-primary hover:underline">{r.programName}</Link> : r.programName}
                      <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">{r.number}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{r.offeringNames.join(' · ')}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t(`services.channel_${r.channel}`)} · <LocalDate value={r.createdAt} /></p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status]}`}>{t(`services.status_${r.status}`)}</span>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  {r.status === 'SCHEDULED' && r.scheduledAt && (
                    <p className="flex items-center gap-2 font-medium text-foreground"><CalendarClock className="size-4 text-primary" /> {t('services.scheduled_for')} <LocalDate value={r.scheduledAt} mode="datetime" options={{ dateStyle: 'full', timeStyle: 'short' }} /></p>
                  )}
                  {r.status === 'PENDING' && r.preferredAt && (
                    <p className="text-muted-foreground">{t('services.preferred')} <LocalDate value={r.preferredAt} mode="datetime" options={{ dateStyle: 'medium', timeStyle: 'short' }} /></p>
                  )}
                  {r.channel === 'CALL' && r.phone && open && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4" /> {t('services.we_will_call').replace('{phone}', r.phone)}</p>}
                  {r.staffNote && <p className="rounded-md bg-muted/50 p-2 text-muted-foreground"><span className="font-semibold text-foreground">{t('services.team_note')}:</span> {r.staffNote}</p>}
                  {r.status === 'CANCELLED' && r.cancelReason && <p className="text-muted-foreground">{t('services.cancelled_because')} {r.cancelReason}</p>}
                </div>

                {open && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.channel === 'MEETING' && r.meetingLink && (
                      <a href={r.meetingLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: 'sm' })}><ExternalLink /> {t('services.join_meeting')}</a>
                    )}
                    {(r.channel === 'MESSAGE' || r.handledById) && (
                      <Link href={r.handledById ? `/member/messages?to=${r.handledById}` : '/member/messages'} className={buttonVariants({ size: 'sm', variant: r.channel === 'MESSAGE' ? 'default' : 'outline' })}><MessageSquare /> {t('services.message_us')}</Link>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setError(''); setReason(''); setCancelling(r) }}>{t('services.cancel_request')}</Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={!!cancelling} onClose={() => !busy && setCancelling(null)} title={t('services.cancel_request')} size="sm">
        <div className="space-y-3">
          <Label htmlFor="cancel-reason">{t('services.cancel_reason')}</Label>
          <Textarea id="cancel-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" /> {error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelling(null)} disabled={busy}>{t('services.keep')}</Button>
            <Button variant="destructive" onClick={cancel} disabled={busy || reason.trim().length < 3}>{t('services.cancel_request')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
