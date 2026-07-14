/** Research project status, per APP_DOC Task 7.1 / Prisma `ResearchProject.status`. */
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'

export interface Contributor {
  id: string
  name: string
}

export interface ResearchProjectSummary {
  id: string
  title: string
  description: string
  status: ProjectStatus
  startDate: string
  contributors: Contributor[]
}

export const mockProjects: ResearchProjectSummary[] = [
  {
    id: 'proj-001',
    title: 'Faith & Technology in Rural Rwanda',
    description: 'Exploring how digital tools shape discipleship and community life in rural congregations.',
    status: 'ACTIVE',
    startDate: '2026-02-10',
    contributors: [
      { id: 'c-001', name: 'Dr. Alice Mutoni' },
      { id: 'c-002', name: 'Elder Samuel Byiringiro' },
      { id: 'c-003', name: 'Pastor Emmanuel Rugamba' },
    ],
  },
  {
    id: 'proj-002',
    title: 'Discipleship Retention Among Youth',
    description: 'A longitudinal study on what keeps young adults engaged in discipleship programs.',
    status: 'ACTIVE',
    startDate: '2026-03-01',
    contributors: [
      { id: 'c-002', name: 'Elder Samuel Byiringiro' },
      { id: 'c-004', name: 'Grace Mukamana' },
    ],
  },
  {
    id: 'proj-003',
    title: 'Oral History of the East African Revival',
    description: 'Recording and archiving first-hand accounts from the mid-20th century revival movement.',
    status: 'COMPLETED',
    startDate: '2025-09-15',
    contributors: [
      { id: 'c-003', name: 'Pastor Emmanuel Rugamba' },
      { id: 'c-005', name: 'David Ndayisenga' },
      { id: 'c-006', name: 'Sarah Uwase' },
    ],
  },
  {
    id: 'proj-004',
    title: 'Mental Health Stigma in Faith Communities',
    description: 'Suspended pending additional ethics review before data collection can resume.',
    status: 'SUSPENDED',
    startDate: '2025-11-20',
    contributors: [{ id: 'c-004', name: 'Grace Mukamana' }],
  },
]

export const projectStatusConfig: Record<ProjectStatus, { label: string; cls: string; bg: string; color: string; border: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50 text-green-800 border-green-200', bg: 'var(--green-dim)',  color: 'var(--green)',           border: 'var(--green)'  },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100    text-w-700     border-w-300',     bg: 'var(--bg-section)', color: 'var(--text-secondary)',  border: 'var(--border)' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50   text-red-800   border-red-200',   bg: 'var(--red-dim)',    color: 'var(--red)',             border: 'var(--red)'    },
}
