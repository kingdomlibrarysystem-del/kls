import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { issueCertificateIfEligible } from '@/app/api/_shared/issue-certificate-if-eligible'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/** Real AssessmentAttempt API, replacing the single-persona AssessmentAttempt embedded in app/member/_shared/enrollment-data.ts (no userId at all). */
function serializeAttempt(a: {
  id: string
  userId: string
  assessmentId: string
  status: string
  reviewStatus: string
  score: number
  totalMarks: number
  takenAt: Date
  openAnswers: unknown
  openScores: unknown
}) {
  return {
    id: a.id,
    userId: a.userId,
    assessmentId: a.assessmentId,
    status: a.status,
    reviewStatus: a.reviewStatus,
    score: a.score,
    totalMarks: a.totalMarks,
    takenAt: a.takenAt.toISOString().split('T')[0],
    openAnswers: a.openAnswers ?? undefined,
    openScores: a.openScores ?? undefined,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const userId = searchParams.get('userId')
  const assessmentId = searchParams.get('assessmentId')
  const reviewStatus = searchParams.get('reviewStatus')

  const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
  if (auth.response) return auth.response

  const where = {
    ...(userId && { userId }),
    ...(assessmentId && { assessmentId }),
    ...(reviewStatus && { reviewStatus: reviewStatus.toUpperCase() as 'AUTO_GRADED' | 'PENDING_REVIEW' | 'GRADED' }),
  }

  const [totalItems, attempts] = await Promise.all([
    prisma.assessmentAttempt.count({ where }),
    prisma.assessmentAttempt.findMany({ where, orderBy: { takenAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: attempts.map(serializeAttempt),
    message: 'Assessment attempts fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const createAttemptSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  assessmentId: z.string().min(1, 'assessmentId is required'),
  submission: z.string().optional(),
  answers: z.record(z.string(), z.union([z.number(), z.array(z.number())])).optional(),
  openAnswers: z.record(z.string(), z.string()).optional(),
})

/**
 * Records a real attempt, auto-grading SINGLE_SELECT/MULTI_SELECT
 * questions server-side and leaving OPEN questions pending manual
 * review — ports the mock's own recordAssessmentAttempt/
 * recordProjectSubmission auto-grading logic from
 * use-assessment-attempts.ts.
 */
export const POST = withErrorHandling('/api/assessment-attempts', 'POST', async (request: NextRequest) => {
  const parsed = createAttemptSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const [user, assessment] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.assessment.findUnique({ where: { id: body.assessmentId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!assessment) throw new ApiError('The specified assessment does not exist', 400)

  if (assessment.kind === 'PROJECT') {
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId: body.userId,
        assessmentId: body.assessmentId,
        status: 'FAILED',
        reviewStatus: 'PENDING_REVIEW',
        score: 0,
        totalMarks: assessment.projectMarks ?? 0,
        openAnswers: body.submission ? { project: body.submission } : undefined,
      },
    })
    return NextResponse.json({ data: serializeAttempt(attempt), message: 'Project submitted for review', code: 'success', status: 201 }, { status: 201 })
  }

  const answers: Record<string, number | number[]> = body.answers ?? {}
  let autoScore = 0
  let totalMarks = 0
  const openAnswers: Record<string, string> = {}
  let hasOpen = false

  for (const q of assessment.questions) {
    totalMarks += q.marks
    if (q.type === 'SINGLE_SELECT') {
      if (answers[q.id] === q.correctOptionIndex) autoScore += q.marks
    } else if (q.type === 'MULTI_SELECT') {
      const given = new Set((answers[q.id] as number[]) ?? [])
      const correct = new Set(q.correctOptionIndices)
      const matches = given.size === correct.size && [...given].every((v) => correct.has(v))
      if (matches) autoScore += q.marks
    } else if (q.type === 'OPEN') {
      hasOpen = true
      const textAnswers: Record<string, string> = body.openAnswers ?? {}
      if (textAnswers[q.id]) openAnswers[q.id] = textAnswers[q.id]
    }
  }

  const reviewStatus = hasOpen ? 'PENDING_REVIEW' : 'AUTO_GRADED'
  const status = hasOpen ? 'FAILED' : autoScore >= totalMarks * 0.5 ? 'PASSED' : 'FAILED'

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      userId: body.userId,
      assessmentId: body.assessmentId,
      status,
      reviewStatus,
      score: autoScore,
      totalMarks,
      openAnswers: hasOpen ? openAnswers : undefined,
    },
  })

  /**
   * Ports use-enrollments.ts's applyAttemptOutcome: an AUTO_GRADED PASSED
   * attempt (no OPEN questions) immediately flips the linked enrollment's
   * assessmentPassed, then re-checks certificate eligibility — mirroring
   * the mock's "pass/fail is only applied to the enrollment once it's
   * final" rule (a PENDING_REVIEW attempt never reaches this branch).
   */
  if (reviewStatus === 'AUTO_GRADED' && status === 'PASSED') {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: body.userId, courseId: assessment.courseId } } })
    if (enrollment) {
      await prisma.enrollment.update({ where: { id: enrollment.id }, data: { assessmentPassed: true } })
      await issueCertificateIfEligible(body.userId, assessment.courseId)
    }
  }

  return NextResponse.json({ data: serializeAttempt(attempt), message: 'Assessment attempt recorded', code: 'success', status: 201 }, { status: 201 })
})
