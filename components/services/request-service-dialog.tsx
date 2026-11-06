'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Loader2, LogIn } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/language-context'
import { SERVICE_CHANNEL_CODES, type ServiceChannelCode, type ServiceOfferingItem } from '@/lib/services/shared'
import { ChannelIcon } from './channel-icon'

interface Props {
  open: boolean
  onClose: () => void
  program: { id: string; name: string }
  /** The sub-services being requested (one or several). */
  offerings: ServiceOfferingItem[]
  signedIn: boolean
  /** Where a guest signs in (comes back to this page). */
  signInHref: string
  defaultPhone?: string
  onSent?: () => void
}

/**
 * "Get this service": choose how to be helped (phone call, messages, online
 * meeting — only the ways every chosen sub-service offers), an optional
 * preferred time, the phone to call, and a short note. Sends one request for
 * all the chosen sub-services. Guests are asked to sign in first.
 */
export function RequestServiceDialog({ open, onClose, program, offerings, signedIn, signInHref, defaultPhone = '', onSent }: Props) {
  const { t } = useLanguage()
  const common = SERVICE_CHANNEL_CODES.filter((c) => offerings.every((o) => o.channels.includes(c)))
  const [channel, setChannel] = useState<ServiceChannelCode | null>(common[0] ?? null)
  const [preferredAt, setPreferredAt] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<string | null>(null)

  // The chosen way may not be offered any more after the selection changed.
  const active = channel && common.includes(channel) ? channel : common[0] ?? null

  const submit = async () => {
    if (!active) return
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/services/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: program.id, offeringIds: offerings.map((o) => o.id), channel: active,
          preferredAt: preferredAt ? new Date(preferredAt).toISOString() : null,
          phone: active === 'CALL' ? phone.trim() : null, note: note.trim(),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not send the request')
      setSent(json.data.number)
      onSent?.()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send the request') } finally { setBusy(false) }
  }

  const close = () => { if (busy) return; setSent(null); setError(''); onClose() }
  // Requests live in the member portal (signed in by now).
  const requestsHref = '/member/services/requests'

  return (
    <Modal open={open} onClose={close} title={sent ? t('services.sent_title') : `${t('services.get_service')} — ${program.name}`} size="lg">
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">{t('services.sent_text').replace('{number}', sent)}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={requestsHref} className={buttonVariants()}>{t('services.my_requests')}</Link>
            {active === 'MESSAGE' && <Link href="/member/messages" className={buttonVariants({ variant: 'outline' })}>{t('services.open_messages')}</Link>}
            <Button variant="outline" onClick={close}>{t('services.close')}</Button>
          </div>
        </div>
      ) : !signedIn ? (
        <div className="space-y-4 text-center">
          <LogIn className="mx-auto size-9 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">{t('services.sign_in_hint')}</p>
          <Link href={signInHref} className={buttonVariants({ size: 'lg' })}>{t('services.sign_in_to_request')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('services.for_services')}</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {offerings.map((o) => <li key={o.id} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm text-foreground">{o.name}</li>)}
            </ul>
          </div>

          {common.length === 0 ? (
            <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{t('services.no_common_channel')}</p>
          ) : (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">{t('services.how_talk')}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {common.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={active === c} onClick={() => setChannel(c)}
                    className={`flex flex-col items-start gap-1 rounded-lg border-[1.5px] p-3 text-left transition-colors ${active === c ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}>
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground"><ChannelIcon channel={c} className="size-4 text-primary" /> {t(`services.channel_${c}`)}</span>
                    <span className="text-xs text-muted-foreground">{t(`services.channel_${c}_hint`)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rq-when">{t('services.preferred_time')} <span className="font-normal text-muted-foreground">({t('services.optional')})</span></Label>
              <Input id="rq-when" type="datetime-local" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} />
            </div>
            {active === 'CALL' && (
              <div className="space-y-1.5">
                <Label htmlFor="rq-phone">{t('services.phone')}</Label>
                <Input id="rq-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="078 123 4567" maxLength={20} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rq-note">{t('services.note')}</Label>
            <Textarea id="rq-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('services.note_ph')} maxLength={2000} />
          </div>

          {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" /> {error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={busy}>{t('services.close')}</Button>
            <Button onClick={submit} disabled={busy || !active || note.trim().length < 5 || (active === 'CALL' && phone.trim().length < 9)}>
              {busy ? <><Loader2 className="animate-spin" /> {t('services.sending')}</> : t('services.send_request')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
