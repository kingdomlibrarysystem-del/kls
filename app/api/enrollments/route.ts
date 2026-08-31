import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { enrollmentConfirmedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

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

const INCLUDE = { user: { select: { name: true, firstName: true, lastName: true } }, course: { select: { title: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const userId = searchParams.get('userId')
  const courseId = searchParams.get('courseId')
  const status = searchParams.get('status')

  const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
  if (auth.response) return auth.response

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

const createEnrollmentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  courseId: z.string().min(1, 'courseId is required'),
})

/** Enrolling twice in the same course is blocked by the real @@unique([userId, courseId]) constraint. */
export const POST = withErrorHandling('/api/enrollments', 'POST', async (request: NextRequest) => {
  const parsed = createEnrollmentSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.course.findUnique({ where: { id: body.courseId }, include: { _count: { select: { lessons: true } } } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!course) throw new ApiError('The specified course does not exist', 400)

  const already = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: body.userId, courseId: body.courseId } } })
  if (already) throw new ApiError('This user is already enrolled in this course', 409)

  if (course.price > 0) throw new ApiError('This course requires payment — use /api/course-orders to pay and enroll', 400)

  const enrollment = await prisma.enrollment.create({
    data: {
      userId: body.userId,
      courseId: body.courseId,
      totalLessons: course._count.lessons,
      completedLessonIds: [],
      status: 'ENROLLED',
      paid: true,
    },
    include: INCLUDE,
  })

  const memberName = user.name ?? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'there')
  const coursesUrl = `${appBaseUrl()}/member/courses`
  await notifyUser({
    userId: body.userId,
    type: 'COURSE',
    category: 'course-enrollment',
    title: 'Enrolled in course',
    message: `You're enrolled in "${course.title}".`,
    href: '/member/courses',
    email: { subject: 'Your course enrollment is confirmed', html: enrollmentConfirmedEmailHtml(memberName, course.title, coursesUrl) },
  })

  return NextResponse.json({ data: serializeEnrollment(enrollment), message: 'Enrolled successfully', code: 'success', status: 201 }, { status: 201 })
})
