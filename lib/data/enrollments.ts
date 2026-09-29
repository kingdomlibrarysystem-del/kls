import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeEnrollment(e: {
  id: string
  userId: string
  user: { name: string | null; firstName: string | null; lastName: string | null }
  courseId: string
  course: { title: string }
  status: string
  enrolledAt: Date
  completedLessonIds: string[]
  totalLessons: number
  assessmentPassed: boolean
  paid: boolean
}) {
  const memberName = e.user.name ?? `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim()
  const progress = e.totalLessons > 0 ? Math.round((e.completedLessonIds.length / e.totalLessons) * 100) : 0
  return {
    id: e.id,
    userId: e.userId,
    member: memberName,
    courseId: e.courseId,
    courseTitle: e.course.title,
    enrolledAt: e.enrolledAt.toISOString().split('T')[0],
    status: e.status,
    progress,
    completedLessonIds: e.completedLessonIds,
    totalLessons: e.totalLessons,
    assessmentPassed: e.assessmentPassed,
    paid: e.paid,
  }
}

export const INCLUDE = { user: { select: { name: true, firstName: true, lastName: true } }, course: { select: { title: true } } } as const

/** One enrollment in the GET /api/enrollments/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getEnrollmentDetail(id: string) {
  if (!isObjectId(id)) return null
  const enrollment = await prisma.enrollment.findUnique({ where: { id }, include: INCLUDE })
  return enrollment ? { ownerId: enrollment.userId, enrollment: serializeEnrollment(enrollment) } : null
}

/** Every enrollment in one course, in the /api/enrollments list shape — for the course detail page's Enrollments panel (instead of downloading all enrollments and filtering in the browser). */
export async function getCourseEnrollments(courseId: string) {
  if (!isObjectId(courseId)) return []
  const rows = await prisma.enrollment.findMany({ where: { courseId }, include: INCLUDE, orderBy: { enrolledAt: 'desc' } })
  return rows.map(serializeEnrollment)
}
