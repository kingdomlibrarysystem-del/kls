/**
 * Publication status, per APP_DOC Task 5.1–5.4 / Prisma `Publication.status`.
 * This is the FULL state machine — DRAFT/APPROVED/REJECTED/PUBLISHED were
 * previously only modeled on the contributor's own (disconnected)
 * use-my-submissions.ts store; this file now owns the single source of
 * truth both the admin Review Queue and the contributor's My Submissions
 * page read (see use-review-queue.ts's docstring for why they were
 * merged).
 */
export type PublicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'

/** Language a submission was authored in, matching the published-catalog vocabulary. */
export type SubmissionLanguage = 'en' | 'fr' | 'rw'

export interface PublicationSubmission {
  id: string
  title: string
  contributor: string
  category: string
  submittedAt: string
  status: PublicationStatus
  language: SubmissionLanguage
  coverImage: string
  description: string
}

/** Statuses a contributor may still withdraw before a manager has started reviewing. */
export const withdrawableStatuses: PublicationStatus[] = ['DRAFT', 'SUBMITTED']

export const publicationStatusConfig: Record<PublicationStatus, { label: string; cls: string; bg: string; color: string; border: string }> = {
  DRAFT:        { label: 'Draft',        cls: 'bg-w-100     text-w-700      border-w-300',      bg: 'var(--bg-section)', color: 'var(--text-secondary)', border: 'var(--border)' },
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', bg: 'var(--gold-light)', color: '#7a5c00',               border: 'var(--gold)'   },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-teal-50   text-teal-800   border-teal-200',   bg: 'var(--teal-dim)',   color: 'var(--teal)',           border: 'var(--teal)'   },
  APPROVED:     { label: 'Approved',     cls: 'bg-blue-50   text-blue-800   border-blue-200',   bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8',            border: '#3b82f6'       },
  REJECTED:     { label: 'Rejected',     cls: 'bg-red-50    text-red-800    border-red-200',    bg: 'var(--red-dim)',    color: 'var(--red)',            border: 'var(--red)'    },
  PUBLISHED:    { label: 'Published',    cls: 'bg-green-50  text-green-800  border-green-200',  bg: 'var(--green-dim)',  color: 'var(--green)',           border: 'var(--green)'  },
}
