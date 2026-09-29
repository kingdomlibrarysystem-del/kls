export type { CourseCatalogEntry, CourseStatus } from '../../_shared/course-catalog-data'
import type { CourseStatus } from '../../_shared/course-catalog-data'

export const statusConfig: Record<CourseStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-w-100 text-w-700 border-w-300' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50 dark:bg-success/10 text-green-800 dark:text-success border-green-200 dark:border-success/30' },
}
