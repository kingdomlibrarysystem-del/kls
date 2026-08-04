import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

/**
 * Records a real attempt, auto-grading SINGLE_SELECT/MULTI_SELECT
 * questions server-side and leaving OPEN questions pending manual
 * review — ports the mock's own recordAssessmentAttempt/
 * recordProjectSubmission auto-grading logic from
 * use-assessment-attempts.ts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.userId || !body.assessmentId) {
      return NextResponse.json({ data: null, message: 'Missing required fields: userId, assessmentId', code: 'error', status: 400 }, { status: 400 })
    }
    const [user, assessment] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.userId } }),
      prisma.assessment.findUnique({ where: { id: body.assessmentId } }),
    ])
    if (!user) {
      return NextResponse.json({ data: null, message: 'The specified user does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    if (!assessment) {
      return NextResponse.json({ data: null, message: 'The specified assessment does not exist', code: 'error', status: 400 }, { status: 400 })
    }

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
    return NextResponse.json({ data: serializeAttempt(attempt), message: 'Assessment attempt recorded', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to record assessment attempt', code: 'error', status: 500 }, { status: 500 })
  }
}
