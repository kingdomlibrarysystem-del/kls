import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

/**
 * `action: 'gradeOpenAnswers'` ports use-assessment-attempts.ts's
 * gradeOpenAnswers — a manager submits per-question scores for OPEN
 * answers, this adds them to the auto-graded score, flips reviewStatus
 * to GRADED, and determines final pass/fail against the assessment's
 * total marks (guarded: only a PENDING_REVIEW attempt can be graded).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.assessmentAttempt.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Assessment attempt not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.action === 'gradeOpenAnswers') {
      if (existing.reviewStatus !== 'PENDING_REVIEW') {
        return NextResponse.json({ data: null, message: 'Only an attempt pending review can be graded', code: 'error', status: 409 }, { status: 409 })
      }
      const openScores: Record<string, number> = body.openScores ?? {}
      const openScoreTotal = Object.values(openScores).reduce((sum, v) => sum + v, 0)
      const finalScore = existing.score + openScoreTotal
      const status = finalScore >= existing.totalMarks * 0.5 ? 'PASSED' : 'FAILED'
      const updated = await prisma.assessmentAttempt.update({
        where: { id },
        data: { openScores, score: finalScore, reviewStatus: 'GRADED', status },
      })
      return NextResponse.json({ data: serializeAttempt(updated), message: 'Attempt graded successfully', code: 'success', status: 200 })
    }

    const data: Record<string, unknown> = { ...body }
    delete data.action
    delete data.id
    delete data.userId
    delete data.assessmentId
    const updated = await prisma.assessmentAttempt.update({ where: { id }, data })
    return NextResponse.json({ data: serializeAttempt(updated), message: 'Assessment attempt updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update assessment attempt', code: 'error', status: 500 }, { status: 500 })
  }
}
