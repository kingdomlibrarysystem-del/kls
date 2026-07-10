'use client'

import Link from 'next/link'
import { CalendarClock, User, GraduationCap } from 'lucide-react'
import { CountdownTimer } from '@/app/member/assessments/[assessmentId]/take/_components/countdown-timer'
import { useCountdownToTime } from './use-countdown-to-time'
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
 * For APPROVED sessions, the Join/Start button's enabled state is
 * genuinely driven by a live countdown to `scheduledAt`, not decorative.
 */
export function SessionCard({ request, viewer }: SessionCardProps) {
  const otherPartyLabel = viewer === 'learner' ? request.lecturerName : request.learnerName
  const roomHref = viewer === 'learner' ? `/member/sessions/${request.id}/room` : `/lecturer/sessions/${request.id}/room`
  const secondsRemaining = useCountdownToTime(request.status === 'APPROVED' ? request.scheduledAt : undefined)
  const canJoin = request.status === 'APPROVED' && secondsRemaining <= 0

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GraduationCap size={14} color="var(--gold)" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{request.courseTitle}</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${sessionStatusConfig[request.status].cls}`}>
          {sessionStatusConfig[request.status].label}
        </span>
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
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>This session has ended.</p>
      )}

      {request.status === 'APPROVED' && request.scheduledAt && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(request.scheduledAt).toLocaleString()}</span>
            {!canJoin && <CountdownTimer secondsRemaining={secondsRemaining} onTick={() => {}} onExpire={() => {}} />}
          </div>
          {canJoin ? (
            <Link
              href={roomHref}
              aria-label={viewer === 'learner' ? 'Join session' : 'Start session'}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
            >
              {viewer === 'learner' ? 'Join Session' : 'Start Session'}
            </Link>
          ) : (
            <button
              disabled
              aria-label="Session has not started yet"
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-section)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'not-allowed' }}
            >
              Not Yet Started
            </button>
          )}
        </div>
      )}
    </div>
  )
}
