/** Live-session booking request, per the confirmed Phase 3 design doc. */
export type SessionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

/**
 * SCHEDULED is the original propose-a-future-time flow (PENDING → lecturer
 * approves → countdown to scheduledAt). INSTANT is the Meet-style "start
 * now" flow — created directly as APPROVED with scheduledAt set to the
 * creation time, skipping PENDING/approval entirely since there is no one
 * to approve a session that's already starting. A `mode` field was chosen
 * over a 5th SessionStatus value because instant sessions still need a
 * real status to drive the same APPROVED→COMPLETED lifecycle (ending the
 * mock room still calls completeSession()) — the distinction is about how
 * a session got to APPROVED, not a different terminal state.
 */
export type SessionMode = 'SCHEDULED' | 'INSTANT'

/** Matches /api/session-requests' serializeSessionRequest (see app/api/session-requests/route.ts). */
export interface SessionRequest {
  id: string
  learnerId: string
  learnerName: string
  /** Unset for a SCHEDULED request submitted with no lecturer in mind — see prisma/schema.prisma's SessionRequest.lecturerId docstring. */
  lecturerId?: string
  lecturerName?: string
  courseId: string
  courseTitle: string
  /** ISO date the request was made. */
  requestedAt: string
  /** ISO datetime the learner is requesting. */
  proposedTime: string
  status: SessionStatus
  /** SCHEDULED (default) or INSTANT — see SessionMode's docstring. */
  mode: SessionMode
  /** Set once a lecturer approves — the actual session start time, may differ from proposedTime if negotiated. For INSTANT sessions this is set to the creation time, not negotiated. */
  scheduledAt?: string
  /** Learner's stated reason/topic on request, and/or the lecturer's approve/reject note. */
  notes?: string
}

export const sessionStatusConfig: Record<SessionStatus, { label: string; cls: string; bg: string; color: string; border: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', bg: 'var(--gold-light)', color: '#7a5c00',       border: 'var(--gold)'   },
  APPROVED:  { label: 'Approved',  cls: 'bg-green-50  text-green-800  border-green-200',  bg: 'var(--green-dim)',  color: 'var(--green)',   border: 'var(--green)'  },
  REJECTED:  { label: 'Rejected',  cls: 'bg-red-50    text-red-800    border-red-200',    bg: 'var(--red-dim)',    color: 'var(--red)',     border: 'var(--red)'    },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100      text-w-800      border-w-300',     bg: 'var(--bg-section)', color: 'var(--text-secondary)', border: 'var(--border)' },
}

