import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeCourse(c: {
  id: string
  title: string
  description: string
  category: string
  language: string
  status: string
  author: string
  lecturerId: string | null
  lecturer?: { name: string | null; firstName: string | null; lastName: string | null } | null
  image: string | null
  duration: string | null
  rating: string | null
  price: number
  createdAt: Date
  _count?: { lessons: number; enrollments: number }
}) {
  const lecturerName = c.lecturer
    ? c.lecturer.name ?? `${c.lecturer.firstName ?? ''} ${c.lecturer.lastName ?? ''}`.trim()
    : undefined
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    language: c.language.toLowerCase(),
    status: c.status,
    author: c.author,
    lecturerId: c.lecturerId ?? undefined,
    instructor: lecturerName,
    image: c.image ?? undefined,
    duration: c.duration ?? undefined,
    rating: c.rating ?? undefined,
    price: c.price,
    lessons: c._count?.lessons ?? 0,
    students: c._count?.enrollments ?? 0,
    createdAt: c.createdAt.toISOString().split('T')[0],
  }
}

export const LECTURER_SELECT = { lecturer: { select: { name: true, firstName: true, lastName: true } }, _count: { select: { lessons: true, enrollments: true } } } as const

/** One course in the GET /api/courses/[id] shape. */
export async function getCourseDetail(id: string) {
  if (!isObjectId(id)) return null
  const course = await prisma.course.findUnique({ where: { id }, include: LECTURER_SELECT })
  return course ? serializeCourse(course) : null
}

/** Just a course's title (e.g. to label a lesson) — one indexed lookup instead of loading the catalog. */
export async function getCourseTitle(courseId: string): Promise<string> {
  if (!isObjectId(courseId)) return ''
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } })
  return course?.title ?? ''
}
