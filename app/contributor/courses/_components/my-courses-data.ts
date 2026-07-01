/** Course status, per APP_DOC Task 6.1 / Prisma `Course.status`. */
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface MyCourse {
  id: string
  title: string
  category: string
  enrolledCount: number
  status: CourseStatus
}

/** Mock courses belonging to the signed-in contributor ("Pastor Emmanuel Rugamba"). */
export const myCourses: MyCourse[] = [
  { id: 'crs-005', title: 'Leadership for Ministry Teams', category: 'Leadership', enrolledCount: 12, status: 'PUBLISHED' },
]

export const courseStatusConfig: Record<CourseStatus, { label: string; cls: string }> = {
  DRAFT:     { label: 'Draft',     cls: 'bg-w-100    text-w-700     border-w-300'     },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50 text-green-800 border-green-200' },
  ARCHIVED:  { label: 'Archived',  cls: 'bg-w-100    text-w-600     border-w-300'     },
}
