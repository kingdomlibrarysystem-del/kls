export type { CourseCatalogEntry, CourseStatus } from '@/app/dashboard/e-learning/_shared/course-catalog-data'
import type { CourseStatus } from '@/app/dashboard/e-learning/_shared/course-catalog-data'

export const courseStatusConfig: Record<CourseStatus, { label: string; bg: string; color: string; border: string }> = {
  DRAFT: { label: 'Draft', bg: 'var(--bg-section)', color: 'var(--text-secondary)', border: 'var(--border)' },
  PUBLISHED: { label: 'Published', bg: 'var(--green-dim)', color: 'var(--green)', border: 'var(--green)' },
}
