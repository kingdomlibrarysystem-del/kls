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

const placeholderCovers = ['/images/book-A.jpg', '/images/book-B.jpg', '/images/book-C.jpg']

/**
 * Seed data — merges the two previously-separate seed sets (admin's
 * mockSubmissions and contributor's mySubmissions) into one. Rows that
 * existed in both under the same id (pub-001, pub-004) are unified into a
 * single row carrying every field either side needs (contributor's
 * DRAFT/APPROVED/PUBLISHED rows now also have language/coverImage/
 * description so the admin Review Queue's detail preview keeps working for
 * every status, not just SUBMITTED/UNDER_REVIEW).
 */
export const mockSubmissions: PublicationSubmission[] = [
  { id: 'pub-001', title: 'Walking in Covenant',   contributor: 'Pastor Emmanuel Rugamba', category: 'Theology',          submittedAt: '2026-06-02', status: 'SUBMITTED',    language: 'en', coverImage: placeholderCovers[0], description: 'A study of covenant relationship and what it means to walk faithfully within it, drawing on Kingdom Foundation principles.' },
  { id: 'pub-002', title: 'Raising Kingdom Families', contributor: 'Dr. Alice Mutoni',        category: 'Family & Marriage', submittedAt: '2026-06-05', status: 'UNDER_REVIEW', language: 'en', coverImage: placeholderCovers[1], description: 'Biblical foundations for raising children with Kingdom identity and purpose in a modern context.' },
  { id: 'pub-003', title: 'The Discipleship Journey', contributor: 'Elder Samuel Byiringiro', category: 'Discipleship',      submittedAt: '2026-06-10', status: 'SUBMITTED',    language: 'en', coverImage: placeholderCovers[2], description: 'A practical guide to walking with new believers from first steps of faith to mature discipleship.' },
  { id: 'pub-004', title: 'Leading with Humility',    contributor: 'Pastor Emmanuel Rugamba', category: 'Leadership',        submittedAt: '2026-06-14', status: 'UNDER_REVIEW', language: 'en', coverImage: placeholderCovers[0], description: 'On servant leadership and why humility, not position, is the true measure of Kingdom authority.' },
  { id: 'pub-005', title: 'Voices of the Revival',    contributor: 'Pastor Emmanuel Rugamba', category: 'History',          submittedAt: '2026-04-28', status: 'APPROVED',     language: 'en', coverImage: placeholderCovers[1], description: 'Oral histories and testimonies gathered from a season of revival, preserved for future generations.' },
  { id: 'pub-006', title: 'The Weight of Servant Leadership', contributor: 'Pastor Emmanuel Rugamba', category: 'Leadership', submittedAt: '2026-03-10', status: 'PUBLISHED',  language: 'en', coverImage: placeholderCovers[2], description: 'A deeper look at the cost and calling of leading others through service rather than status.' },
]

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
