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

export const projectStatusConfig: Record<ProjectStatus, { label: string; cls: string; bg: string; color: string; border: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50 text-green-800 border-green-200', bg: 'var(--green-dim)',  color: 'var(--green)',           border: 'var(--green)'  },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100    text-w-700     border-w-300',     bg: 'var(--bg-section)', color: 'var(--text-secondary)',  border: 'var(--border)' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50   text-red-800   border-red-200',   bg: 'var(--red-dim)',    color: 'var(--red)',             border: 'var(--red)'    },
}
