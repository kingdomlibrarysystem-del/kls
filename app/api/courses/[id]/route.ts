import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Course not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.lecturerId) {
      const lecturer = await prisma.user.findUnique({ where: { id: body.lecturerId } })
      if (!lecturer) {
        return NextResponse.json({ data: null, message: 'The specified lecturer does not exist', code: 'error', status: 400 }, { status: 400 })
      }
    }

    const data: Record<string, unknown> = { ...body }
    delete data.id
    if (typeof data.language === 'string') data.language = data.language.toUpperCase()

    const updated = await prisma.course.update({ where: { id }, data, include: LECTURER_SELECT })
    return NextResponse.json({ data: serializeCourse(updated), message: 'Course updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update course', code: 'error', status: 500 }, { status: 500 })
  }
}

/** Guarded delete: blocks removing a course that still has real enrollments, mirroring the "don't silently orphan learner progress" guard already established for Category deletes in Phase 2. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Course not found', code: 'error', status: 404 }, { status: 404 })
  }
  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } })
  if (enrollmentCount > 0) {
    return NextResponse.json({ data: null, message: 'Cannot delete a course with active enrollments', code: 'error', status: 409 }, { status: 409 })
  }
  await prisma.lesson.deleteMany({ where: { courseId: id } })
  await prisma.course.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Course deleted successfully', code: 'success', status: 200 })
}
