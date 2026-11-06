import prisma from '@/prisma/client'

/**
 * Whether a member has finished a course — always measured against the
 * course's CURRENT published lessons, not the lesson count stored when they
 * enrolled (lessons added or removed later used to leave members stuck or
 * finish them too early).
 */
export async function publishedLessonIds(courseId: string): Promise<string[]> {
  const lessons = await prisma.lesson.findMany({ where: { courseId, status: 'PUBLISHED' }, select: { id: true } })
  return lessons.map((l) => l.id)
}

/** COMPLETED when every published lesson is in completedLessonIds (a course with no published lessons is never "finished"). */
export function progressStatus(completedLessonIds: string[], lessonIds: string[]): 'COMPLETED' | 'ENROLLED' {
  const done = new Set(completedLessonIds)
  return lessonIds.length > 0 && lessonIds.every((id) => done.has(id)) ? 'COMPLETED' : 'ENROLLED'
}

/** Certificate rule: the course is finished, and its final exam is passed — or the course has no final exam. */
export async function certificateEligible(e: { status: string; assessmentPassed: boolean; courseId: string }): Promise<boolean> {
  if (e.status !== 'COMPLETED') return false
  if (e.assessmentPassed) return true
  const exam = await prisma.assessment.findFirst({ where: { courseId: e.courseId, kind: 'EXAM' }, select: { id: true } })
  return !exam
}
