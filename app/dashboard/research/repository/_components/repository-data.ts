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

export const mockPapers: ResearchPaper[] = [
  {
    id: 'paper-001',
    title: 'Faith and Resilience in Rural Communities',
    author: 'Dr. Alice Mutoni',
    project: 'Faith & Technology in Rural Rwanda',
    keywords: ['faith', 'resilience', 'rural ministry'],
    publishedAt: '2026-04-20',
    status: 'PUBLISHED',
  },
  {
    id: 'paper-002',
    title: 'Digital Tools for Discipleship Retention',
    author: 'Elder Samuel Byiringiro',
    project: 'Discipleship Retention Among Youth',
    keywords: ['technology', 'discipleship', 'youth'],
    publishedAt: '2026-05-14',
    status: 'PUBLISHED',
  },
  {
    id: 'paper-003',
    title: 'Voices of the Revival: An Oral History Study',
    author: 'Pastor Emmanuel Rugamba',
    project: 'Oral History of the East African Revival',
    keywords: ['oral history', 'revival', 'east africa'],
    publishedAt: '2026-06-02',
    status: 'PUBLISHED',
  },
]

export const paperStatusConfig: Record<PaperStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-w-100     text-w-700      border-w-300'      },
  SUBMITTED: { label: 'Submitted', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50  text-green-800  border-green-200'  },
}
