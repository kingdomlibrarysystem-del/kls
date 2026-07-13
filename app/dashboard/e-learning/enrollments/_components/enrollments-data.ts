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

/**
 * Five static seed members with no real backing store (this mock system
 * has exactly one live member persona, "John Doe" — see use-enrollments.ts).
 * The "John Doe" row is NOT here; it's derived live from the real
 * `useEnrollments()` store in enrollments-view.tsx, the same pattern
 * ELearningProgress.tsx already uses, so it reflects genuine enroll/
 * complete-lesson/pass-assessment activity instead of a frozen snapshot.
 */
export const mockEnrollments: Enrollment[] = [
  { id: 'en-001', member: 'Jean Paul Nkurunziza', courseId: '1', enrolledAt: '2026-04-02', status: 'COMPLETED', progress: 100 },
  { id: 'en-002', member: 'Amina Uwimana', courseId: '2', enrolledAt: '2026-05-11', status: 'ACTIVE', progress: 62 },
  { id: 'en-003', member: 'Eric Habimana', courseId: '5', enrolledAt: '2026-05-20', status: 'ACTIVE', progress: 34 },
  { id: 'en-004', member: 'Grace Mukamana', courseId: '9', enrolledAt: '2026-03-15', status: 'DROPPED', progress: 18 },
  { id: 'en-005', member: 'David Ndayisenga', courseId: '1', enrolledAt: '2026-06-01', status: 'ACTIVE', progress: 45 },
  { id: 'en-006', member: 'Sarah Uwase', courseId: '6', enrolledAt: '2026-02-20', status: 'COMPLETED', progress: 100 },
]

export const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-green-50  text-green-800  border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100     text-w-700      border-w-300' },
  DROPPED: { label: 'Dropped', cls: 'bg-red-50    text-red-800    border-red-200' },
}
