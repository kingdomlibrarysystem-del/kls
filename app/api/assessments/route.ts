import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { serializeAssessment } from '@/lib/data/assessments'
import { loadAccess } from '@/lib/data/course-access'
import { assessmentIsOpen } from '@/lib/course-access'
import { requireAuth, requireStaff } from '@/lib/auth/require-role'

/**
 * Real Assessment API, replacing app/member/_shared/assessment-data.ts's
 * Record<id, TakeableAssessment> — already a single store shared by the
 * admin Quizzes & Exams page and the member take-flow. Questions stay
 * embedded (Prisma Mongo `type Question`), matching the mock's own
 * always-fetched-together shape.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')
  const courseId = searchParams.get('courseId')
  const lessonId = searchParams.get('lessonId')

  const where = { ...(courseId && { courseId }), ...(lessonId && { lessonId }) }

  const [totalItems, assessments] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({ where, orderBy: { createdAt: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  // Paid content: a member gets no questions for an assessment they have not paid for (staff see all).
  const isStaff = auth.session.role !== 'member'
  const access = isStaff ? null : await loadAccess(auth.session.userId, assessments.map((a) => a.courseId))
  const lessonIds = [...new Set(assessments.flatMap((a) => (a.lessonId ? [a.lessonId] : [])))]
  const lessons = access && lessonIds.length ? await prisma.lesson.findMany({ where: { id: { in: lessonIds } }, select: { id: true, access: true, price: true } }) : []
  const lessonsById = new Map(lessons.map((l) => [l.id, l]))
  const view = (a: (typeof assessments)[number]) => {
    const data = serializeAssessment(a)
    if (!access || assessmentIsOpen(a, lessonsById, access.priceOf(a.courseId), access.enrollmentOf(a.courseId))) return data
    return { ...data, questions: [], briefFileUrl: undefined, brief: undefined, locked: true }
  }

  return NextResponse.json({
    data: assessments.map(view),
    message: 'Assessments fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const matchingPairSchema = z.object({
  left: z.string().trim().min(1),
  right: z.string().trim().min(1),
})

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().trim().min(1, 'question text is required'),
  type: z.string(),
  context: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctOptionIndex: z.number().int().optional(),
  correctOptionIndices: z.array(z.number().int()).optional(),
  matchingPairs: z.array(matchingPairSchema).optional(),
  marks: z.number(),
})

const createAssessmentSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  kind: z.string().min(1, 'kind is required'),
  courseId: z.string().min(1, 'courseId is required'),
  lessonId: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  questions: z.array(questionSchema).optional(),
  brief: z.string().optional(),
  briefFileUrl: z.string().url().startsWith('https://', 'The project document must be an uploaded file').optional(),
  briefFileName: z.string().max(200).optional(),
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
  if (body.kind === 'PROJECT' && !body.briefFileUrl) {
    throw new ApiError('Upload the project document (PDF, Word, PowerPoint…)', 400)
  }
  if (body.kind === 'TEST' && !body.lessonId) {
    throw new ApiError('A test must be linked to a lesson', 400)
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: body.title,
      kind: body.kind as 'TEST' | 'QUIZ' | 'EXAM' | 'PROJECT',
      courseId: body.courseId,
      // A lesson quiz / test shows on its own lesson only.
      lessonId: body.kind === 'TEST' || body.kind === 'QUIZ' ? body.lessonId ?? null : null,
      durationSeconds: body.durationSeconds ?? null,
      questions: (body.questions ?? []).map((q, i) => ({
        id: q.id ?? `q${i + 1}`,
        text: q.text,
        type: q.type as 'SINGLE_SELECT' | 'MULTI_SELECT' | 'OPEN' | 'YES_NO' | 'TRUE_FALSE' | 'MATCHING',
        context: q.context ?? null,
        options: q.options ?? [],
        correctOptionIndex: q.correctOptionIndex ?? null,
        correctOptionIndices: q.correctOptionIndices ?? [],
        matchingPairs: q.matchingPairs ?? [],
        marks: q.marks,
      })),
      brief: body.brief ?? null,
      briefFileUrl: body.kind === 'PROJECT' ? body.briefFileUrl ?? null : null,
      briefFileName: body.kind === 'PROJECT' ? body.briefFileName ?? null : null,
      submissionFormat: (body.submissionFormat as 'TEXT' | 'LINK' | 'FILE_REF' | undefined) ?? null,
      projectMarks: body.projectMarks ?? null,
    },
  })
  return NextResponse.json({ data: serializeAssessment(assessment), message: 'Assessment created successfully', code: 'success', status: 201 }, { status: 201 })
})
