/** Enrollment status vocabulary, per APP_DOC Task 6.3 / Prisma `Enrollment.status`. */
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED'

/**
 * Admin-side enrollment row. `courseId` matches the member course catalog's
 * `'1'..'12'` IDs (`app/member/_shared/course-catalog-data.ts`) — previously
 * this was a denormalized `course` title string with no foreign key at all,
 * so it could silently drift from the catalog it was describing. `member`/
 * `memberName` has no equivalent in the real member enrollment store
 * (`use-enrollments.ts`'s `CourseEnrollment` is single-persona and has no
 * member field at all), so this admin-only type keeps it — this page's
 * whole reason to exist is showing enrollments across multiple members.
 */
export interface Enrollment {
  id: string
  member: string
  courseId: string
  enrolledAt: string
  status: EnrollmentStatus
  progress: number
}

export const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-green-50 dark:bg-success/10  text-green-800 dark:text-success  border-green-200 dark:border-success/30' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100     text-w-700      border-w-300' },
  DROPPED: { label: 'Dropped', cls: 'bg-red-50 dark:bg-destructive/10    text-red-800 dark:text-destructive    border-red-200 dark:border-destructive/30' },
}
