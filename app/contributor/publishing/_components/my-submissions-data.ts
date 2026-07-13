/** Publication status, per APP_DOC Task 5.1–5.4 / Prisma `Publication.status`. */
export type PublicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED'

export interface MySubmission {
  id: string
  title: string
  category: string
  submittedAt: string
  status: PublicationStatus
}

/** Mock submissions belonging to the signed-in contributor ("Pastor Emmanuel Rugamba"). */
export const mySubmissions: MySubmission[] = [
  { id: 'pub-001', title: 'Walking in Covenant', category: 'Theology', submittedAt: '2026-06-02', status: 'SUBMITTED' },
  { id: 'pub-004', title: 'Leading with Humility', category: 'Leadership', submittedAt: '2026-06-14', status: 'UNDER_REVIEW' },
  { id: 'pub-005', title: 'Voices of the Revival', category: 'History', submittedAt: '2026-04-28', status: 'APPROVED' },
  { id: 'pub-006', title: 'The Weight of Servant Leadership', category: 'Leadership', submittedAt: '2026-03-10', status: 'PUBLISHED' },
]

export const publicationStatusConfig: Record<PublicationStatus, { label: string; cls: string }> = {
  DRAFT:        { label: 'Draft',        cls: 'bg-w-100     text-w-700      border-w-300'      },
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-teal-50   text-teal-800   border-teal-200'   },
  APPROVED:     { label: 'Approved',     cls: 'bg-blue-50   text-blue-800   border-blue-200'   },
  REJECTED:     { label: 'Rejected',     cls: 'bg-red-50    text-red-800    border-red-200'    },
  PUBLISHED:    { label: 'Published',    cls: 'bg-green-50  text-green-800  border-green-200'  },
}
