'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarClock, CheckCircle2, Globe2, Loader2, MapPin, MessageCircle, Phone, UserRound, Video, XCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Modal } from '@/components/ui/modal'
import { LocalDate } from '@/components/ui/local-date'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import type { CareSession, CounselorItem } from '@/lib/care/data'

type Mode = 'PHONE' | 'VIRTUAL' | 'IN_PERSON'
const MODES: { value: Mode; label: string; hint: string; icon: typeof Phone }[] = [
  { value: 'PHONE', label: 'Phone call', hint: 'They call you', icon: Phone },
  { value: 'VIRTUAL', label: 'Video call', hint: 'Link sent on confirmation', icon: Video },
  { value: 'IN_PERSON', label: 'In person', hint: 'Meet at the centre', icon: MapPin },
]
const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Waiting for confirmation', cls: 'border-warning/30 bg-warning/10 text-warning' },
  CONFIRMED: { label: 'Confirmed', cls: 'border-success/30 bg-success/10 text-success' },
  COMPLETED: { label: 'Completed', cls: 'border-border bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Cancelled', cls: 'border-border bg-muted text-muted-foreground' },
}

/** Local "YYYY-MM-DDTHH:mm" for a datetime-local input. */
function localInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Default booking time (tomorrow, on the hour) and the earliest allowed (1 hour from now). Read when the form opens. */
function bookingTimes() {
  const now = Date.now()
  const t = new Date(now + 24 * 3600 * 1000)
  t.setMinutes(0, 0, 0)
  return { when: localInput(t), min: localInput(new Date(now + 3600 * 1000)), now }
}

interface Props {
  userId: string
  counselors: CounselorItem[]
  initialSessions: CareSession[]
  defaultPhone: string
}

export function CounselingView({ userId, counselors, initialSessions, defaultPhone }: Props) {
  const [sessions, setSessions] = useState(initialSessions)
  const [booking, setBooking] = useState<CounselorItem | null>(null)
  const [mode, setMode] = useState<Mode>('PHONE')
  const [when, setWhen] = useState('')
  const [minWhen, setMinWhen] = useState('')
  const [phone, setPhone] = useState(defaultPhone)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [cancelling, setCancelling] = useState<CareSession | null>(null)

  const upcoming = sessions.filter((s) => s.status === 'PENDING' || s.status === 'CONFIRMED')
  const past = sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'CANCELLED')

  const openBooking = (c: CounselorItem) => {
    setBooking(c)
    setError('')
    setReason('')
    const times = bookingTimes()
    setWhen(times.when)
    setMinWhen(times.min)
  }

  const book = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking) return
    setError('')
    if (!when) return setError('Choose a date and time')
    const at = new Date(when)
    if (at.getTime() < bookingTimes().now + 30 * 60 * 1000) return setError('Choose a time at least 30 minutes from now')
    if (mode === 'PHONE' && !/^(\+?25)?(078|079|075|073|072)\d{7}$/.test(phone.replace(/\s/g, ''))) return setError('Enter the number they should call, e.g. 078 123 4567')
    if (reason.trim().length < 5) return setError('Tell us briefly what you would like to talk about')
    setBusy(true)
    try {
      const res = await fetch('/api/counseling/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, counselorId: booking.id, proposedTime: at.toISOString(), mode, contactPhone: mode === 'PHONE' ? phone : undefined, reason: reason.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not send the request')
      setSessions((list) => [json.data, ...list])
      setBooking(null)
      setToast(`Request sent to ${booking.name}. You will be notified as soon as it is confirmed.`)
      setTimeout(() => setToast(''), 6000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request')
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    if (!cancelling) return
    setBusy(true)
    try {
      const res = await fetch(`/api/counseling/sessions/${cancelling.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Could not cancel')
      setSessions((list) => list.map((s) => (s.id === cancelling.id ? json.data : s)))
      setToast('Session cancelled.')
      setTimeout(() => setToast(''), 4000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not cancel')
    } finally {
      setBusy(false)
      setCancelling(null)
    }
  }

  const modeIcon = (m: string) => (m === 'PHONE' ? Phone : m === 'VIRTUAL' ? Video : MapPin)
  const modeLabel = (m: string) => MODES.find((x) => x.value === m)?.label ?? 'In person'

  const sessionCard = (s: CareSession) => {
    const Icon = modeIcon(s.mode)
    const st = STATUS[s.status] ?? STATUS.PENDING
    return (
      <li key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{s.counselorName}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="size-4" /> <LocalDate value={s.proposedTime} mode="datetime" options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }} />
              <span aria-hidden>·</span> <Icon className="size-4" /> {modeLabel(s.mode)}
            </p>
          </div>
          <Badge variant="outline" className={st.cls}>{st.label}</Badge>
        </div>
        {s.status === 'CONFIRMED' && (
          <p className="mt-2 rounded-md bg-success/10 px-3 py-2 text-sm text-foreground">
            {s.mode === 'PHONE' ? <>{s.counselorName} will call you on <b>{s.contactPhone}</b>.</> : s.meetingDetails ? <>{s.mode === 'VIRTUAL' ? 'Join: ' : 'Where: '}<b className="break-all">{s.meetingDetails}</b></> : 'Details will follow.'}
          </p>
        )}
        {s.staffNote && <p className="mt-2 text-sm text-muted-foreground">Note: {s.staffNote}</p>}
        {(s.status === 'PENDING' || s.status === 'CONFIRMED' || s.counselorUserId) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {s.counselorUserId && <Link href={`/member/messages?to=${s.counselorUserId}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}><MessageCircle /> Message</Link>}
            {(s.status === 'PENDING' || s.status === 'CONFIRMED') && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelling(s)}><XCircle /> Cancel</Button>
            )}
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <p role="status" className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-foreground"><CheckCircle2 className="size-4 text-success" /> {toast}</p>}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 font-cinzel text-lg font-bold text-foreground">Your sessions</h2>
          <ul className="grid gap-3 md:grid-cols-2">{upcoming.map(sessionCard)}</ul>
        </section>
      )}

      <section>
        <h2 className="mb-1 font-cinzel text-lg font-bold text-foreground">Choose a counselor</h2>
        <p className="mb-3 text-sm text-muted-foreground">Pick who you would like to speak with. They will confirm a time that works.</p>
        {counselors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">No counselors are taking bookings right now. Please check back soon.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {counselors.map((c) => (
              <li key={c.id} className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    <RemoteImage src={c.image} alt={c.name} fill sizes="56px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-muted-foreground"><UserRound className="size-6" /></div>} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{c.name}</p>
                    <p className="text-sm text-primary">{c.specialty}</p>
                  </div>
                </div>
                {c.bio && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.bio}</p>}
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {c.languages.length > 0 && <p className="flex items-center gap-1.5"><Globe2 className="size-3.5" /> {c.languages.join(', ')}</p>}
                  {c.availability && <p className="flex items-center gap-1.5"><CalendarClock className="size-3.5" /> {c.availability}</p>}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => openBooking(c)}>Book a session</Button>
                  {c.userId && <Link href={`/member/messages?to=${c.userId}`} className={buttonVariants({ variant: 'outline' })} aria-label={`Message ${c.name}`}><MessageCircle /></Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 font-cinzel text-lg font-bold text-foreground">Past sessions</h2>
          <ul className="grid gap-3 md:grid-cols-2">{past.map(sessionCard)}</ul>
        </section>
      )}

      <Modal open={!!booking} onClose={() => { if (!busy) setBooking(null) }} title={booking ? `Book with ${booking.name}` : ''} size="lg">
        {booking && (
          <form onSubmit={book} className="space-y-4">
            {error && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" /> {error}</p>}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">How would you like to talk?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {MODES.map(({ value, label, hint, icon: Icon }) => (
                  <label key={value} className={cn('flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors', mode === value ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted')}>
                    <input type="radio" name="mode" className="sr-only" checked={mode === value} onChange={() => setMode(value)} />
                    <Icon className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block font-medium">{label}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className={cn('grid gap-3', mode === 'PHONE' && 'sm:grid-cols-2')}>
              <div className="space-y-1.5">
                <Label htmlFor="session-when">Preferred date &amp; time</Label>
                <Input id="session-when" type="datetime-local" value={when} min={minWhen} onChange={(e) => setWhen(e.target.value)} />
              </div>
              {mode === 'PHONE' && (
                <div className="space-y-1.5">
                  <Label htmlFor="session-phone">Number to call</Label>
                  <Input id="session-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="078 123 4567" autoComplete="tel" />
                </div>
              )}
            </div>
            {booking.availability && <p className="text-xs text-muted-foreground">Usually available: {booking.availability}. They may suggest another time.</p>}
            <div className="space-y-1.5">
              <Label htmlFor="session-reason">What would you like to talk about?</Label>
              <Textarea id="session-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={2000} placeholder="Share as much or as little as you are comfortable with." />
              <p className="text-xs text-muted-foreground">Only the counseling team sees this.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setBooking(null)}>Cancel</Button>
              <Button type="submit" disabled={busy} aria-busy={busy}>{busy && <Loader2 className="animate-spin" />} {busy ? 'Sending…' : 'Send request'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!cancelling} onClose={() => setCancelling(null)} title="Cancel this session?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">You can book again at any time.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelling(null)}>Keep it</Button>
            <Button variant="destructive" disabled={busy} onClick={cancel}>{busy && <Loader2 className="animate-spin" />} Cancel session</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
