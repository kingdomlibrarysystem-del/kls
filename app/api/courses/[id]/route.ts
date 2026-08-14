import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

function serializeCourse(c: {
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
    lessons: c._count?.lessons ?? 0,
    students: c._count?.enrollments ?? 0,
    createdAt: c.createdAt.toISOString().split('T')[0],
  }
}

const LECTURER_SELECT = { lecturer: { select: { name: true, firstName: true, lastName: true } }, _count: { select: { lessons: true, enrollments: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await prisma.course.findUnique({ where: { id }, include: LECTURER_SELECT })
  if (!course) {
    return NextResponse.json({ data: null, message: 'Course not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeCourse(course), message: 'Course fetched successfully', code: 'success', status: 200 })
}

const updateCourseSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  language: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  author: z.string().optional(),
  lecturerId: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  rating: z.string().nullable().optional(),
})

export const PATCH = withErrorHandling('/api/courses/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = updateCourseSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Course not found', 404)

  if (body.lecturerId) {
    const lecturer = await prisma.user.findUnique({ where: { id: body.lecturerId } })
    if (!lecturer) throw new ApiError('The specified lecturer does not exist', 400)
  }

  const data: Record<string, unknown> = { ...body }
  if (typeof data.language === 'string') data.language = data.language.toUpperCase()

  const updated = await prisma.course.update({ where: { id }, data, include: LECTURER_SELECT })
  return NextResponse.json({ data: serializeCourse(updated), message: 'Course updated successfully', code: 'success', status: 200 })
})

/** Guarded delete: blocks removing a course that still has real enrollments, mirroring the "don't silently orphan learner progress" guard already established for Category deletes in Phase 2. */
export const DELETE = withErrorHandling('/api/courses/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Course not found', 404)

  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } })
  if (enrollmentCount > 0) throw new ApiError('Cannot delete a course with active enrollments', 409)

  await prisma.lesson.deleteMany({ where: { courseId: id } })
  await prisma.course.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Course deleted successfully', code: 'success', status: 200 })
})
