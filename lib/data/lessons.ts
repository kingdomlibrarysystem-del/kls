import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeLesson(l: { id: string; courseId: string; title: string; contentType: string; durationMinutes: number; content: string; contentMarkdown: string | null; order: number }) {
  return {
    id: l.id,
    courseId: l.courseId,
    title: l.title,
    contentType: l.contentType,
    durationMinutes: l.durationMinutes,
    content: l.content,
    contentMarkdown: l.contentMarkdown ?? undefined,
    order: l.order,
  }
}

/** One lesson in the GET /api/lessons/[id] shape. */
export async function getLessonDetail(id: string) {
  if (!isObjectId(id)) return null
  const lesson = await prisma.lesson.findUnique({ where: { id } })
  return lesson ? serializeLesson(lesson) : null
}

/** One course's lessons in display order, only the columns the course detail page's Lessons panel shows. */
export async function getCourseLessonRows(courseId: string) {
  if (!isObjectId(courseId)) return []
  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, contentType: true, durationMinutes: true },
  })
}
