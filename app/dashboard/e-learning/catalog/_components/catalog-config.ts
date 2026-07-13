export type { CourseCatalogEntry, CourseStatus } from '../../_shared/course-catalog-data'
import type { CourseStatus } from '../../_shared/course-catalog-data'

export const statusConfig: Record<CourseStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-w-100 text-w-700 border-w-300' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50 text-green-800 border-green-200' },
}
