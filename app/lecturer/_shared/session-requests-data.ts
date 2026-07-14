/** Live-session booking request, per the confirmed Phase 3 design doc. */
export type SessionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export interface SessionRequest {
  id: string
  learnerName: string
  lecturerName: string
  courseId: string
  courseTitle: string
  /** ISO date the request was made. */
  requestedAt: string
  /** ISO datetime the learner is requesting. */
  proposedTime: string
  status: SessionStatus
  /** Set once a lecturer approves — the actual session start time, may differ from proposedTime if negotiated. */
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

/** No seed requests — this feature is genuinely new; every request in the demo is one a learner actually made in session. */
export const mockSessionRequests: SessionRequest[] = []
