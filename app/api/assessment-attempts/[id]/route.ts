import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { issueCertificateIfEligible } from '@/app/api/_shared/issue-certificate-if-eligible'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id } })
  if (!attempt) {
    return NextResponse.json({ data: null, message: 'Assessment attempt not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeAttempt(attempt), message: 'Assessment attempt fetched successfully', code: 'success', status: 200 })
}

const patchAttemptSchema = z.union([
  z.object({ action: z.literal('gradeOpenAnswers'), openScores: z.record(z.string(), z.number()).optional() }),
  z.object({ action: z.undefined() }).passthrough(),
])

/**
 * `action: 'gradeOpenAnswers'` ports use-assessment-attempts.ts's
 * gradeOpenAnswers — a manager submits per-question scores for OPEN
 * answers, this adds them to the auto-graded score, flips reviewStatus
 * to GRADED, and determines final pass/fail against the assessment's
 * total marks (guarded: only a PENDING_REVIEW attempt can be graded).
 */
export const PATCH = withErrorHandling('/api/assessment-attempts/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = patchAttemptSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.assessmentAttempt.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Assessment attempt not found', 404)

  if (body.action === 'gradeOpenAnswers') {
    if (existing.reviewStatus !== 'PENDING_REVIEW') {
      throw new ApiError('Only an attempt pending review can be graded', 409)
    }
    const openScores = body.openScores ?? {}
    const openScoreTotal = Object.values(openScores).reduce((sum, v) => sum + v, 0)
    const finalScore = existing.score + openScoreTotal
    const status = finalScore >= existing.totalMarks * 0.5 ? 'PASSED' : 'FAILED'
    const updated = await prisma.assessmentAttempt.update({
      where: { id },
      data: { openScores, score: finalScore, reviewStatus: 'GRADED', status },
    })

    /**
     * Ports use-enrollments.ts's applyAttemptOutcome for the "graded
     * later" path: only now — once GRADED finalizes pass/fail — does the
     * outcome apply to the enrollment and (if eligible) issue a
     * certificate, matching the mock's rule that a PENDING_REVIEW
     * attempt's provisional score never counts toward eligibility.
     */
    if (status === 'PASSED') {
      const assessment = await prisma.assessment.findUnique({ where: { id: updated.assessmentId } })
      if (assessment) {
        const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: updated.userId, courseId: assessment.courseId } } })
        if (enrollment) {
          await prisma.enrollment.update({ where: { id: enrollment.id }, data: { assessmentPassed: true } })
          await issueCertificateIfEligible(updated.userId, assessment.courseId)
        }
      }
    }

    return NextResponse.json({ data: serializeAttempt(updated), message: 'Attempt graded successfully', code: 'success', status: 200 })
  }

  const data: Record<string, unknown> = { ...body }
  delete data.action
  const updated = await prisma.assessmentAttempt.update({ where: { id }, data })
  return NextResponse.json({ data: serializeAttempt(updated), message: 'Assessment attempt updated successfully', code: 'success', status: 200 })
})
