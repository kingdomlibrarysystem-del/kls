'use client'

import Link from 'next/link'
import { CalendarClock, User, GraduationCap, Zap } from 'lucide-react'
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
 * For SCHEDULED APPROVED sessions, the Join/Start button's enabled state
 * is genuinely driven by a live countdown to `scheduledAt`, not
 * decorative. INSTANT sessions skip the countdown entirely — they're
 * created already-joinable, so canJoin is true the moment they exist.
 */
export function SessionCard({ request, viewer }: SessionCardProps) {
  const otherPartyLabel = viewer === 'learner' ? request.lecturerName : request.learnerName
  const roomHref = viewer === 'learner' ? `/member/sessions/${request.id}/room` : `/lecturer/sessions/${request.id}/room`
  const isInstant = request.mode === 'INSTANT'
  /** INSTANT sessions never wait on a countdown — there's nothing to count down to, they're joinable the moment they exist. */
  const secondsRemaining = useCountdownToTime(request.status === 'APPROVED' && !isInstant ? request.scheduledAt : undefined)
  const canJoin = request.status === 'APPROVED' && (isInstant || secondsRemaining <= 0)

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
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>This session has ended.</p>
      )}

      {request.status === 'APPROVED' && request.scheduledAt && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={12} color="var(--text-muted)" />
            {isInstant ? (
              <span style={{ fontSize: 11, color: 'var(--green-light)', fontWeight: 600 }}>Live now</span>
            ) : (
              <>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(request.scheduledAt).toLocaleString()}</span>
                {!canJoin && <CountdownTimer secondsRemaining={secondsRemaining} onTick={() => {}} onExpire={() => {}} />}
              </>
            )}
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
