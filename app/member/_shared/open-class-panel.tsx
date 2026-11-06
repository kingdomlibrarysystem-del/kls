'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarClock, DoorOpen, Hourglass, Loader2, Presentation, Video } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { requestSession, useSessionRequests, type SessionRequest } from '@/lib/sessions/use-session-requests'
import { getJoinWindowState } from '@/lib/sessions/join-window'
import { addNotification } from '@/app/dashboard/notifications/_components/use-notifications'

interface Props {
  course: { id: string; title: string; lecturerId?: string }
  /** Smaller layout for the My Courses list. */
  compact?: boolean
}

/** The browser's "now" as a datetime-local value. */
function nowLocal(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** A clock that ticks every second (only while mounted). */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/**
 * "Open class" (a live online class, formerly "session") for a course the
 * member has finished. Ask for one (the time starts at now and can be
 * changed); while the teacher confirms it shows "waiting"; once confirmed a
 * live countdown (hours / minutes / seconds) runs, and when the class room
 * opens the "Enter the class room" button appears. Only rendered for
 * completed courses — the API also refuses requests for unfinished ones.
 */
export function OpenClassPanel({ course, compact = false }: Props) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { data: requests, loading, refetch } = useSessionRequests()
  const now = useNow()
  const [asking, setAsking] = useState(false)
  const [when, setWhen] = useState('')
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The newest open class for this course that is still waiting or confirmed.
  const current: SessionRequest | undefined = requests
    .filter((r) => r.courseId === course.id && (r.status === 'PENDING' || r.status === 'APPROVED'))
    .sort((a, b) => +new Date(b.requestedAt) - +new Date(a.requestedAt))[0]
  const joinState = current?.status === 'APPROVED' ? getJoinWindowState(current, new Date(now)) : null
  const ended = joinState && !joinState.canJoin && joinState.reason === 'too-late'

  const startAsking = () => { setWhen(nowLocal()); setTopic(''); setError(''); setAsking(true) }

  const send = async () => {
    if (!user) return
    if (!when) { setError(t('m_request.choose_time')); return }
    setBusy(true); setError('')
    try {
      await requestSession({ learnerId: user.id, lecturerId: course.lecturerId, courseId: course.id, proposedTime: new Date(when).toISOString(), notes: topic.trim() || undefined })
      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      addNotification({
        type: 'course', title: t('m_class.notify_title'),
        message: t('m_class.notify_msg').replace('{name}', name).replace('{course}', course.title),
        href: '/dashboard/e-learning/sessions', recipientRole: 'admin',
      }).catch(() => {})
      setAsking(false)
      await refetch()
    } catch (e) { setError(e instanceof Error ? e.message : t('m_request.could_not_submit')) } finally { setBusy(false) }
  }

  const box = `rounded-xl border border-primary/40 bg-primary/5 ${compact ? 'p-3' : 'p-4 sm:p-5'}`
  const header = (
    <p className="flex items-center gap-2 font-cinzel font-bold text-foreground"><Presentation className="size-5 text-primary" aria-hidden /> {t('m_class.title')}</p>
  )

  if (loading) return <div className={box}>{header}<Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" /></div>

  // Nothing open (or the last one is over): ask for a class.
  if (!current || ended) {
    return (
      <section className={box} aria-label={t('m_class.title')}>
        {header}
        {ended && <p className="mt-1 text-sm text-muted-foreground">{t('m_class.ended')}</p>}
        {!asking ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {!compact && !ended && <p className="min-w-0 flex-1 text-sm text-muted-foreground">{t('m_class.intro')}</p>}
            <Button size={compact ? 'sm' : 'default'} onClick={startAsking}><Video /> {ended ? t('m_class.ask_again') : t('m_class.ask')}</Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`oc-when-${course.id}`}>{t('m_class.when')}</Label>
              <Input id={`oc-when-${course.id}`} type="datetime-local" value={when} min={nowLocal()} onChange={(e) => setWhen(e.target.value)} className="max-w-xs" />
              <p className="text-xs text-muted-foreground">{t('m_class.when_hint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`oc-topic-${course.id}`}>{t('m_class.topic')}</Label>
              <Textarea id={`oc-topic-${course.id}`} rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('m_class.topic_ph')} maxLength={1000} />
            </div>
            {error && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" /> {error}</p>}
            <div className="flex gap-2">
              <Button onClick={send} disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> {t('m_class.sending')}</> : t('m_class.send')}</Button>
              <Button variant="outline" onClick={() => setAsking(false)} disabled={busy}>{t('m_class.cancel')}</Button>
            </div>
          </div>
        )}
      </section>
    )
  }

  // Waiting for the teacher to confirm.
  if (current.status === 'PENDING') {
    return (
      <section className={box} aria-label={t('m_class.title')}>
        {header}
        <p className="mt-2 flex items-center gap-2 font-semibold text-foreground"><Hourglass className="size-4 text-primary" /> {t('m_class.pending_title')}</p>
        <p className="text-sm text-muted-foreground">{t('m_class.pending_text').replace('{time}', fmt(current.proposedTime))}</p>
      </section>
    )
  }

  // Confirmed: countdown, then the room button.
  const start = new Date(current.scheduledAt ?? current.proposedTime).getTime()
  const left = Math.max(0, Math.floor((start - now) / 1000))
  const parts = [
    { v: Math.floor(left / 3600), l: t('m_class.hours') },
    { v: Math.floor((left % 3600) / 60), l: t('m_class.minutes') },
    { v: left % 60, l: t('m_class.seconds') },
  ]
  const canEnter = joinState?.canJoin ?? false

  return (
    <section className={box} aria-label={t('m_class.title')}>
      {header}
      <p className="mt-2 flex items-center gap-2 font-semibold text-foreground"><CalendarClock className="size-4 text-primary" /> {t('m_class.scheduled_title')}</p>
      <p className="text-sm text-muted-foreground">
        {t('m_class.starts_at').replace('{time}', fmt(current.scheduledAt ?? current.proposedTime))}
        {current.lecturerName && <> · {t('m_class.teacher')}: {current.lecturerName}</>}
      </p>

      {left > 0 && (
        <div className="mt-3" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('m_class.starts_in')}</p>
          <div className="mt-1 flex gap-2">
            {parts.map((p) => (
              <div key={p.l} className="min-w-16 rounded-lg border border-border bg-card px-3 py-2 text-center shadow-xs">
                <p className="font-cinzel text-2xl font-bold tabular-nums text-foreground" suppressHydrationWarning>{String(p.v).padStart(2, '0')}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {canEnter && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-success">{t('m_class.room_open')}</p>
          <Link href={`/member/sessions/${current.id}/room`} className={buttonVariants({ size: compact ? 'sm' : 'lg' })}><DoorOpen /> {t('m_class.enter')}</Link>
        </div>
      )}
    </section>
  )
}
