import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

/** Real Lesson API, replacing app/member/_shared/lesson-data.ts's Record<courseId, CourseLessons> — already a single store shared by admin and member, so no duplicate-store consolidation was needed here. */
function serializeLesson(l: { id: string; courseId: string; title: string; contentType: string; durationMinutes: number; content: string; contentMarkdown: string | null; order: number }) {
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

const createLessonSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  title: z.string().trim().min(1, 'title is required'),
  contentType: z.enum(['TEXT', 'VIDEO', 'FILE']),
  durationMinutes: z.number().int().nonnegative().optional(),
  content: z.string().optional(),
  /** Real markdown-authored lesson body — see Lesson.contentMarkdown's schema comment. */
  contentMarkdown: z.string().optional(),
})

export const POST = withErrorHandling('/api/lessons', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createLessonSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const course = await prisma.course.findUnique({ where: { id: body.courseId } })
  if (!course) throw new ApiError('The specified course does not exist', 400)

  const maxOrder = await prisma.lesson.aggregate({ where: { courseId: body.courseId }, _max: { order: true } })
  const lesson = await prisma.lesson.create({
    data: {
      courseId: body.courseId,
      title: body.title,
      contentType: body.contentType,
      durationMinutes: body.durationMinutes ?? 0,
      content: body.content ?? '',
      contentMarkdown: body.contentMarkdown ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  })
  return NextResponse.json({ data: serializeLesson(lesson), message: 'Lesson created successfully', code: 'success', status: 201 }, { status: 201 })
})
