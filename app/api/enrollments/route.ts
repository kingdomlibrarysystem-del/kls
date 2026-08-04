import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Enrollment API, replacing app/member/_shared/enrollment-data.ts
 * (single-persona, no userId at all) and
 * app/dashboard/e-learning/enrollments/_components/enrollments-data.ts
 * (admin-only, free-text `member` name, `courseId` FK). `progress` is
 * computed server-side from completedLessonIds.length/totalLessons
 * rather than stored redundantly (the admin mock stored it directly,
 * which could silently drift from the real completed-lessons list).
 */
function serializeEnrollment(e: {
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
  }
}

const INCLUDE = { user: { select: { name: true, firstName: true, lastName: true } }, course: { select: { title: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const userId = searchParams.get('userId')
  const courseId = searchParams.get('courseId')
  const status = searchParams.get('status')

  const where = {
    ...(userId && { userId }),
    ...(courseId && { courseId }),
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'ENROLLED' | 'COMPLETED' | 'DROPPED' }),
  }

  const [totalItems, enrollments] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({ where, include: INCLUDE, orderBy: { enrolledAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: enrollments.map(serializeEnrollment),
    message: 'Enrollments fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

/** Enrolling twice in the same course is blocked by the real @@unique([userId, courseId]) constraint. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.userId || !body.courseId) {
      return NextResponse.json({ data: null, message: 'Missing required fields: userId, courseId', code: 'error', status: 400 }, { status: 400 })
    }
    const [user, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.userId } }),
      prisma.course.findUnique({ where: { id: body.courseId }, include: { _count: { select: { lessons: true } } } }),
    ])
    if (!user) {
      return NextResponse.json({ data: null, message: 'The specified user does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    if (!course) {
      return NextResponse.json({ data: null, message: 'The specified course does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    const already = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: body.userId, courseId: body.courseId } } })
    if (already) {
      return NextResponse.json({ data: null, message: 'This user is already enrolled in this course', code: 'error', status: 409 }, { status: 409 })
    }
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: body.userId,
        courseId: body.courseId,
        totalLessons: course._count.lessons,
        completedLessonIds: [],
        status: 'ENROLLED',
      },
      include: INCLUDE,
    })
    return NextResponse.json({ data: serializeEnrollment(enrollment), message: 'Enrolled successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to enroll', code: 'error', status: 500 }, { status: 500 })
  }
}
