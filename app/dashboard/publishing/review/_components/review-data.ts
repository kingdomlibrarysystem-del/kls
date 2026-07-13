/** Publication review status, per APP_DOC Task 5.1–5.2 / Prisma `Publication.status`. */
export type ReviewStatus = 'SUBMITTED' | 'UNDER_REVIEW'

/** Language a submission was authored in, matching the published-catalog vocabulary. */
export type SubmissionLanguage = 'en' | 'fr' | 'rw'

export interface PublicationSubmission {
  id: string
  title: string
  contributor: string
  category: string
  submittedAt: string
  status: ReviewStatus
  language: SubmissionLanguage
  coverImage: string
  description: string
}

const placeholderCovers = ['/images/book-A.jpg', '/images/book-B.jpg', '/images/book-C.jpg']

export const mockSubmissions: PublicationSubmission[] = [
  { id: 'pub-001', title: 'Walking in Covenant',   contributor: 'Pastor Emmanuel Rugamba', category: 'Theology',          submittedAt: '2026-06-02', status: 'SUBMITTED',    language: 'en', coverImage: placeholderCovers[0], description: 'A study of covenant relationship and what it means to walk faithfully within it, drawing on Kingdom Foundation principles.' },
  { id: 'pub-002', title: 'Raising Kingdom Families', contributor: 'Dr. Alice Mutoni',        category: 'Family & Marriage', submittedAt: '2026-06-05', status: 'UNDER_REVIEW', language: 'en', coverImage: placeholderCovers[1], description: 'Biblical foundations for raising children with Kingdom identity and purpose in a modern context.' },
  { id: 'pub-003', title: 'The Discipleship Journey', contributor: 'Elder Samuel Byiringiro', category: 'Discipleship',      submittedAt: '2026-06-10', status: 'SUBMITTED',    language: 'en', coverImage: placeholderCovers[2], description: 'A practical guide to walking with new believers from first steps of faith to mature discipleship.' },
  { id: 'pub-004', title: 'Leading with Humility',    contributor: 'Pastor Emmanuel Rugamba', category: 'Leadership',        submittedAt: '2026-06-14', status: 'UNDER_REVIEW', language: 'en', coverImage: placeholderCovers[0], description: 'On servant leadership and why humility, not position, is the true measure of Kingdom authority.' },
]

export const reviewStatusConfig: Record<ReviewStatus, { label: string; cls: string }> = {
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-teal-50   text-teal-800   border-teal-200'   },
}
