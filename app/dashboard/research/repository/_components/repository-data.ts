/** Research paper status, per APP_DOC Task 7.2 / Prisma `ResearchPaper.status`. */
export type PaperStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED'

export interface ResearchPaper {
  id: string
  title: string
  author: string
  project: string
  keywords: string[]
  publishedAt: string
  status: PaperStatus
}

export const paperStatusConfig: Record<PaperStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-w-100     text-w-700      border-w-300'      },
  SUBMITTED: { label: 'Submitted', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50  text-green-800  border-green-200'  },
}
