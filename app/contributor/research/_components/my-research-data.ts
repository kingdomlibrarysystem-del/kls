/** Research project status, per APP_DOC Task 7.1 / Prisma `ResearchProject.status`. */
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'

export interface MyResearchProject {
  id: string
  title: string
  status: ProjectStatus
  paperCount: number
}

/** Mock research projects belonging to the signed-in contributor ("Pastor Emmanuel Rugamba"). */
export const myResearchProjects: MyResearchProject[] = [
  { id: 'proj-001', title: 'Faith & Technology in Rural Rwanda', status: 'ACTIVE', paperCount: 1 },
  { id: 'proj-003', title: 'Oral History of the East African Revival', status: 'COMPLETED', paperCount: 1 },
]

export const projectStatusConfig: Record<ProjectStatus, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50 text-green-800 border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100    text-w-700     border-w-300'     },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50   text-red-800   border-red-200'   },
}
