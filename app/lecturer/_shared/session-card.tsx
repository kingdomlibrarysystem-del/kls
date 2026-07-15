'use client'

import Link from 'next/link'
import { CalendarClock, User, GraduationCap, Zap } from 'lucide-react'
import { sessionStatusConfig, type SessionRequest } from './session-requests-data'

interface SessionCardProps {
  request: SessionRequest
  /** Which portal this card renders in — determines the room URL and the "other party" label shown. */
  viewer: 'learner' | 'lecturer'
}

/**
 * One session-request card, shared by both /member/sessions and
 * /lecturer/sessions since their real content is identical modulo which
 * party's name is shown and which portal's room route is used — a
 * deliberate shared component rather than two near-duplicate files.
 *
 * Per the open-access "Slack huddle" policy, entering a session's room
 * is never gated by status or a countdown to `scheduledAt` — any
 * request, PENDING/APPROVED/REJECTED/COMPLETED, gets a real link into
 * its room. `scheduledAt` (when present) is shown purely as information
 * about when the session was proposed/held, not a precondition for
 * entry — this closes the last two gates left over from the earlier
 * "no enrollment/completion gate" decision (354306a / the instant-
 * session pass), which had only removed the requestSession() precondition,
 * not the countdown or the COMPLETED-session block that lived here.
 */
export function SessionCard({ request, viewer }: SessionCardProps) {
  const otherPartyLabel = viewer === 'learner' ? request.lecturerName : request.learnerName
  const roomHref = viewer === 'learner' ? `/member/sessions/${request.id}/room` : `/lecturer/sessions/${request.id}/room`
  const isInstant = request.mode === 'INSTANT'
  const enterLabel = request.status === 'COMPLETED' ? 'Rejoin Session' : viewer === 'learner' ? 'Join Session' : 'Start Session'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GraduationCap size={14} color="var(--gold)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{request.courseTitle}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isInstant && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--gold)', background: 'var(--gold-light)', color: '#7a5c00', fontSize: 10, fontWeight: 700 }}>
              <Zap size={10} /> Instant
            </span>
          )}
          <span
            style={{
              padding: '2px 10px', borderRadius: 6, border: `1px solid ${sessionStatusConfig[request.status].border}`,
              background: sessionStatusConfig[request.status].bg, color: sessionStatusConfig[request.status].color,
              fontSize: 11, fontWeight: 600,
            }}
          >
            {sessionStatusConfig[request.status].label}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
        <User size={12} /> {viewer === 'learner' ? 'Lecturer' : 'Learner'}: {otherPartyLabel}
      </div>

      {request.status === 'PENDING' && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Proposed for {new Date(request.proposedTime).toLocaleString()} — awaiting {viewer === 'learner' ? 'lecturer' : 'your'} response.
        </p>
      )}

      {request.status === 'REJECTED' && request.notes && (
        <p style={{ fontSize: 11, color: 'var(--red-light)' }}>Declined: {request.notes}</p>
      )}

      {request.status === 'COMPLETED' && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>This session has ended — you can still reopen the room below.</p>
      )}

      {request.status === 'APPROVED' && request.scheduledAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarClock size={12} color="var(--text-muted)" />
          {isInstant ? (
            <span style={{ fontSize: 11, color: 'var(--green-light)', fontWeight: 600 }}>Live now</span>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(request.scheduledAt).toLocaleString()}</span>
          )}
        </div>
      )}

      <Link
        href={roomHref}
        aria-label={enterLabel}
        style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
      >
        {enterLabel}
      </Link>
    </div>
  )
}
