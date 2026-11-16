import { getServerSession } from 'next-auth'
import prisma from '@/prisma/client'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import { assessmentIsOpen, lessonIsOpen, type AccessEnrollment } from '@/lib/course-access'

/**
 * Server side of lib/course-access.ts: loads course prices and the member's
 * enrollments, then applies the shared rules. Staff always see everything.
 */

/** Who is asking — optional, because the lesson list is public. */
export async function getViewer(): Promise<{ userId: string | null; staff: boolean }> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  const role = roleNameToUserRole(session?.user?.roleName ?? '')
  return { userId, staff: role === 'admin' || role === 'manager' || role === 'staff' }
}

/** Course prices and this member's enrollments, for the given courses (two small queries). */
export async function loadAccess(userId: string | null, courseIds: string[]) {
  const ids = [...new Set(courseIds)]
  const [courses, enrollments] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: ids } }, select: { id: true, price: true } }),
    userId ? prisma.enrollment.findMany({ where: { userId, courseId: { in: ids } }, select: { courseId: true, paid: true, status: true, unlockedLessonIds: true } }) : Promise.resolve([]),
  ])
  const price = new Map(courses.map((c) => [c.id, c.price ?? 0]))
  const enrollment = new Map<string, AccessEnrollment>(enrollments.map((e) => [e.courseId, e]))
  return { priceOf: (courseId: string) => price.get(courseId) ?? 0, enrollmentOf: (courseId: string) => enrollment.get(courseId) }
}

/** Can this member open the lesson? (Lesson not found → false.) */
export async function memberCanOpenLesson(userId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true, access: true, price: true } })
  if (!lesson) return false
  const access = await loadAccess(userId, [lesson.courseId])
  return lessonIsOpen(lesson, access.priceOf(lesson.courseId), access.enrollmentOf(lesson.courseId))
}

/** Can this member take the assessment? A quiz/test follows its lesson, the rest follow the course. */
export async function memberCanTakeAssessment(userId: string, assessment: { courseId: string; lessonId: string | null }): Promise<boolean> {
  const [access, lesson] = await Promise.all([
    loadAccess(userId, [assessment.courseId]),
    assessment.lessonId ? prisma.lesson.findUnique({ where: { id: assessment.lessonId }, select: { id: true, access: true, price: true } }) : Promise.resolve(null),
  ])
  const lessons = new Map(lesson ? [[lesson.id, lesson]] : [])
  return assessmentIsOpen(assessment, lessons, access.priceOf(assessment.courseId), access.enrollmentOf(assessment.courseId))
}
