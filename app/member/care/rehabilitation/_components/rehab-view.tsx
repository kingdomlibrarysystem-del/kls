'use client'

import { useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, ClipboardList, Flag, Loader2, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LocalDate } from '@/components/ui/local-date'
import { RemoteImage } from '@/components/ui/remote-image'
import { cn } from '@/lib/utils'
import type { MemberRehab } from '@/lib/care/data'

const INTAKE_STATUS: Record<string, { label: string; hint: string; cls: string }> = {
  SUBMITTED: { label: 'Received', hint: 'A coordinator will review it and contact you.', cls: 'border-warning/30 bg-warning/10 text-warning' },
  UNDER_REVIEW: { label: 'Being reviewed', hint: 'A coordinator is preparing your plan.', cls: 'border-info/30 bg-info/10 text-info' },
  PLAN_CREATED: { label: 'Plan ready', hint: 'Your plan is in place — see your sessions below.', cls: 'border-success/30 bg-success/10 text-success' },
  DECLINED: { label: 'Not taken forward', hint: 'See the note below. You can apply again or talk to a counselor.', cls: 'border-border bg-muted text-muted-foreground' },
}
const SESSION_STATUS: Record<string, string> = { SCHEDULED: 'Scheduled', COMPLETED: 'Completed', MISSED: 'Missed', CANCELLED: 'Cancelled' }

/**
 * Recovery programme. Step 1: tell us where you are (intake). Then: join a
 * support group, follow your scheduled sessions and see your milestones.
 */
export function RehabView({ userId, initial }: { userId: string; initial: MemberRehab }) {
  const [data, setData] = useState(initial)
  const latest = data.intakes[0] ?? null
  const canApply = !latest || latest.status === 'DECLINED'
  const [concern, setConcern] = useState('')
  const [history, setHistory] = useState('')
  const [goals, setGoals] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const call = async (url: string, init: RequestInit) => {
    const res = await fetch(url, init)
    const json = await res.json().catch(() => null)
    if (!res.ok || json?.code !== 'success') throw new Error(json?.message ?? 'Something went wrong')
    return json
  }

  const submitIntake = async (e: React.FormEvent) => {
    e.preventDefault()
    if (concern.trim().length < 2 || history.trim().length < 10 || goals.trim().length < 5) {
      setMsg({ ok: false, text: 'Please fill in all three questions (a few sentences is enough).' })
      return
    }
    setBusy('intake')
    setMsg(null)
    try {
      const json = await call('/api/rehabilitation/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, concernArea: concern.trim(), history: history.trim(), goals: goals.trim() }) })
      const i = json.data
      setData((d) => ({ ...d, intakes: [{ id: i.id, concernArea: i.concernArea ?? concern, goals: i.goals ?? goals, status: i.status ?? 'SUBMITTED', reviewNotes: null, submittedAt: i.submittedAt ?? new Date().toISOString() }, ...d.intakes] }))
      setMsg({ ok: true, text: 'Thank you for reaching out. A coordinator will review this and contact you.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setBusy(null)
    }
  }

  const toggleGroup = async (groupId: string, joined: boolean) => {
    setBusy(groupId)
    setMsg(null)
    try {
      if (joined) await call(`/api/rehabilitation/groups?groupId=${groupId}&userId=${userId}`, { method: 'DELETE' })
      else await call('/api/rehabilitation/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, groupId }) })
      setData((d) => ({ ...d, groups: d.groups.map((g) => (g.id === groupId ? { ...g, joined: !joined, memberCount: g.memberCount + (joined ? -1 : 1) } : g)) }))
      setMsg({ ok: true, text: joined ? 'You left the group.' : 'Welcome to the group! The facilitator will share meeting details.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setBusy(null)
    }
  }

  const upcoming = data.sessions.filter((s) => s.status === 'SCHEDULED')
  const pastSessions = data.sessions.filter((s) => s.status !== 'SCHEDULED')

  return (
    <div className="space-y-6">
      {msg && (
        <p role="status" className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-sm', msg.ok ? 'border-success/30 bg-success/10 text-foreground' : 'border-destructive/30 bg-destructive/10 text-destructive')}>
          {msg.ok ? <CheckCircle2 className="size-4 text-success" /> : <AlertCircle className="size-4" />} {msg.text}
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <h2 className="flex items-center gap-2 font-cinzel text-lg font-bold text-foreground"><ClipboardList className="size-5 text-primary" /> Your plan</h2>
        {latest && (
          <div className="mt-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={INTAKE_STATUS[latest.status]?.cls}>{INTAKE_STATUS[latest.status]?.label ?? latest.status}</Badge>
              <span className="text-xs text-muted-foreground">Sent <LocalDate value={latest.submittedAt} options={{ dateStyle: 'medium' }} /></span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{INTAKE_STATUS[latest.status]?.hint}</p>
            <p className="mt-2 text-sm"><span className="font-medium text-foreground">Area:</span> <span className="text-muted-foreground">{latest.concernArea}</span></p>
            <p className="text-sm"><span className="font-medium text-foreground">Your goals:</span> <span className="text-muted-foreground">{latest.goals}</span></p>
            {latest.reviewNotes && <p className="mt-2 rounded-md bg-card px-3 py-2 text-sm text-foreground">Note from your coordinator: {latest.reviewNotes}</p>}
          </div>
        )}
        {canApply && (
          <form onSubmit={submitIntake} className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{latest ? 'You can apply again when you are ready.' : 'Taking the first step takes courage. Answer three short questions — only the programme team sees them.'}</p>
            <div className="space-y-1.5">
              <Label htmlFor="rehab-concern">What would you like help with?</Label>
              <Input id="rehab-concern" value={concern} onChange={(e) => setConcern(e.target.value)} maxLength={120} placeholder="e.g. alcohol, gambling, recovering from loss, anger…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rehab-history">What has been happening?</Label>
              <Textarea id="rehab-history" value={history} onChange={(e) => setHistory(e.target.value)} rows={4} maxLength={3000} placeholder="Share what you feel comfortable sharing." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rehab-goals">What would you like to change?</Label>
              <Textarea id="rehab-goals" value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} maxLength={1500} placeholder="Your hopes for the next few months." />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={busy === 'intake'} aria-busy={busy === 'intake'}>{busy === 'intake' && <Loader2 className="animate-spin" />} {busy === 'intake' ? 'Sending…' : 'Send to the programme team'}</Button>
            </div>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-1 flex items-center gap-2 font-cinzel text-lg font-bold text-foreground"><Users className="size-5 text-primary" /> Support groups</h2>
        <p className="mb-3 text-sm text-muted-foreground">Walk with others who understand. Join as many as help you.</p>
        {data.groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">No groups yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.groups.map((g) => (
              <li key={g.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <RemoteImage src={g.image} alt="" fill sizes="64px" className="object-cover" fallback={<div className="flex size-full items-center justify-center text-primary"><Users className="size-6" /></div>} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-semibold text-foreground">{g.name}</p>
                  <p className="text-xs text-primary">{g.focus} · {g.meetingCadence}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">{g.memberCount} member{g.memberCount === 1 ? '' : 's'}</span>
                    <Button size="sm" variant={g.joined ? 'outline' : 'default'} disabled={busy === g.id} onClick={() => toggleGroup(g.id, g.joined)}>
                      {busy === g.id && <Loader2 className="animate-spin" />} {g.joined ? 'Leave' : 'Join'}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-cinzel text-lg font-bold text-foreground"><CalendarClock className="size-5 text-primary" /> Your sessions</h2>
        {data.sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">Your coordinator will schedule sessions once your plan is ready.</p>
        ) : (
          <ul className="space-y-2">
            {[...upcoming.reverse(), ...pastSessions].map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{s.focus}</p>
                  <p className="text-xs text-muted-foreground">
                    <LocalDate value={s.dateTime} mode="datetime" options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }} />
                    {s.groupName && ` · ${s.groupName}`}{s.facilitator && ` · with ${s.facilitator}`}
                  </p>
                </div>
                <Badge variant="outline" className={s.status === 'SCHEDULED' ? 'border-info/30 bg-info/10 text-info' : s.status === 'COMPLETED' ? 'border-success/30 bg-success/10 text-success' : 'border-border bg-muted text-muted-foreground'}>{SESSION_STATUS[s.status] ?? s.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-cinzel text-lg font-bold text-foreground"><Trophy className="size-5 text-primary" /> Milestones</h2>
        {data.milestones.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">Every step counts. Your milestones will appear here as you reach them.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-primary/30 pl-5">
            {data.milestones.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[29px] top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Flag className="size-3" /></span>
                <p className="font-semibold text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground"><LocalDate value={m.achievedAt} options={{ dateStyle: 'medium' }} /></p>
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
