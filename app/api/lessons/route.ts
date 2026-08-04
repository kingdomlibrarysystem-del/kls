import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/** Real Lesson API, replacing app/member/_shared/lesson-data.ts's Record<courseId, CourseLessons> — already a single store shared by admin and member, so no duplicate-store consolidation was needed here. */
function serializeLesson(l: { id: string; courseId: string; title: string; contentType: string; durationMinutes: number; content: string; order: number }) {
  return {
    id: l.id,
    courseId: l.courseId,
    title: l.title,
    contentType: l.contentType,
    durationMinutes: l.durationMinutes,
    content: l.content,
    order: l.order,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')

  const where = { ...(courseId && { courseId }) }

  const [totalItems, lessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({ where, orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: lessons.map(serializeLesson),
    message: 'Lessons fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.courseId || !body.title || !body.contentType) {
      return NextResponse.json({ data: null, message: 'Missing required fields: courseId, title, contentType', code: 'error', status: 400 }, { status: 400 })
    }
    const course = await prisma.course.findUnique({ where: { id: body.courseId } })
    if (!course) {
      return NextResponse.json({ data: null, message: 'The specified course does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    const maxOrder = await prisma.lesson.aggregate({ where: { courseId: body.courseId }, _max: { order: true } })
    const lesson = await prisma.lesson.create({
      data: {
        courseId: body.courseId,
        title: body.title,
        contentType: body.contentType,
        durationMinutes: body.durationMinutes ?? 0,
        content: body.content ?? '',
        order: (maxOrder._max.order ?? 0) + 1,
      },
    })
    return NextResponse.json({ data: serializeLesson(lesson), message: 'Lesson created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create lesson', code: 'error', status: 500 }, { status: 500 })
  }
}
