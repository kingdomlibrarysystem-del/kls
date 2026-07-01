/** Publication review status, per APP_DOC Task 5.1–5.2 / Prisma `Publication.status`. */
export type ReviewStatus = 'SUBMITTED' | 'UNDER_REVIEW'

export interface PublicationSubmission {
  id: string
  title: string
  contributor: string
  category: string
  submittedAt: string
  status: ReviewStatus
}

export const mockSubmissions: PublicationSubmission[] = [
  { id: 'pub-001', title: 'Walking in Covenant',          contributor: 'Pastor Emmanuel Rugamba', category: 'Theology',    submittedAt: '2026-06-02', status: 'SUBMITTED'    },
  { id: 'pub-002', title: 'Raising Kingdom Families',       contributor: 'Dr. Alice Mutoni',         category: 'Family & Marriage', submittedAt: '2026-06-05', status: 'UNDER_REVIEW' },
  { id: 'pub-003', title: 'The Discipleship Journey',        contributor: 'Elder Samuel Byiringiro',  category: 'Discipleship', submittedAt: '2026-06-10', status: 'SUBMITTED'    },
  { id: 'pub-004', title: 'Leading with Humility',            contributor: 'Pastor Emmanuel Rugamba', category: 'Leadership',   submittedAt: '2026-06-14', status: 'UNDER_REVIEW' },
]

export const reviewStatusConfig: Record<ReviewStatus, { label: string; cls: string }> = {
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-teal-50   text-teal-800   border-teal-200'   },
}
