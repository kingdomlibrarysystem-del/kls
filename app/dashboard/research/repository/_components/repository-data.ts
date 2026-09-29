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
  SUBMITTED: { label: 'Submitted', cls: 'bg-yellow-50 dark:bg-warning/10 text-yellow-800 dark:text-warning border-yellow-200 dark:border-warning/30' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50 dark:bg-success/10  text-green-800 dark:text-success  border-green-200 dark:border-success/30'  },
}
