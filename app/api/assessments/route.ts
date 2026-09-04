import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'

/**
 * Real Assessment API, replacing app/member/_shared/assessment-data.ts's
 * Record<id, TakeableAssessment> — already a single store shared by the
 * admin Quizzes & Exams page and the member take-flow. Questions stay
 * embedded (Prisma Mongo `type Question`), matching the mock's own
 * always-fetched-together shape.
 *
 * Members can only see assessments for courses they are enrolled in.
 * Staff/admin can see all assessments.
 */
function serializeAssessment(a: {
  id: string
  title: string
  kind: string
  courseId: string
  durationSeconds: number | null
  questions: { id: string; text: string; type: string; context: string | null; options: string[]; correctOptionIndex: number | null; correctOptionIndices: number[]; marks: number }[]
  brief: string | null
  submissionFormat: string | null
  projectMarks: number | null
}) {
  return {
    id: a.id,
    title: a.title,
    kind: a.kind,
    courseId: a.courseId,
    durationSeconds: a.durationSeconds ?? undefined,
    questions: a.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      context: q.context ?? undefined,
      options: q.options.length ? q.options : undefined,
      correctOptionIndex: q.correctOptionIndex ?? undefined,
      correctOptionIndices: q.correctOptionIndices.length ? q.correctOptionIndices : undefined,
      marks: q.marks,
    })),
    brief: a.brief ?? undefined,
    submissionFormat: a.submissionFormat ?? undefined,
    projectMarks: a.projectMarks ?? undefined,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')
  const courseId = searchParams.get('courseId')

  const isStaff = auth.session.role === 'admin' || auth.session.role === 'manager' || auth.session.role === 'staff'

  let enrolledCourseIds: string[] | null = null
  if (!isStaff) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: auth.session.userId, status: { in: ['ENROLLED', 'COMPLETED'] } },
      select: { courseId: true },
    })
    enrolledCourseIds = enrollments.map((e) => e.courseId)
    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'Assessments fetched successfully',
        code: 'success',
        status: 200,
        pagination: { page, pageSize, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      })
    }
  }

  const where = {
    ...(courseId && { courseId }),
    ...(!isStaff && enrolledCourseIds ? { courseId: { in: enrolledCourseIds } } : {}),
  }

  const [totalItems, assessments] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({ where, orderBy: { createdAt: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: assessments.map(serializeAssessment),
    message: 'Assessments fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, 'question text is required'),
  type: z.string(),
  context: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctOptionIndex: z.number().int().optional(),
  correctOptionIndices: z.array(z.number().int()).optional(),
  marks: z.number(),
})

const createAssessmentSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  kind: z.string().min(1, 'kind is required'),
  courseId: z.string().min(1, 'courseId is required'),
  durationSeconds: z.number().int().nonnegative().optional(),
  questions: z.array(questionSchema).optional(),
  brief: z.string().optional(),
  submissionFormat: z.string().optional(),
  projectMarks: z.number().optional(),
})

export const POST = withErrorHandling('/api/assessments', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createAssessmentSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const course = await prisma.course.findUnique({ where: { id: body.courseId } })
  if (!course) throw new ApiError('The specified course does not exist', 400)

  const assessment = await prisma.assessment.create({
    data: {
      title: body.title,
      kind: body.kind as 'QUIZ' | 'EXAM' | 'PROJECT',
      courseId: body.courseId,
      durationSeconds: body.durationSeconds ?? null,
      questions: (body.questions ?? []).map((q, i) => ({
        id: q.id ?? `q${i + 1}`,
        text: q.text,
        type: q.type as 'SINGLE_SELECT' | 'MULTI_SELECT' | 'OPEN',
        context: q.context ?? null,
        options: q.options ?? [],
        correctOptionIndex: q.correctOptionIndex ?? null,
        correctOptionIndices: q.correctOptionIndices ?? [],
        marks: q.marks,
      })),
      brief: body.brief ?? null,
      submissionFormat: (body.submissionFormat as 'TEXT' | 'LINK' | 'FILE_REF' | undefined) ?? null,
      projectMarks: body.projectMarks ?? null,
    },
  })
  return NextResponse.json({ data: serializeAssessment(assessment), message: 'Assessment created successfully', code: 'success', status: 201 }, { status: 201 })
})
