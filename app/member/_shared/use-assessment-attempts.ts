'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

/** Real AssessmentAttempt shape, matching /api/assessment-attempts' serializeAttempt. */
export interface AssessmentAttempt {
  id: string
  userId: string
  assessmentId: string
  status: 'PASSED' | 'FAILED'
  reviewStatus: 'AUTO_GRADED' | 'PENDING_REVIEW' | 'GRADED'
  score: number
  totalMarks: number
  /** ISO date, stamped at submission time. */
  takenAt: string
  openAnswers?: Record<string, string>
  openScores?: Record<string, number>
}

/** One member's submitted answer to a single question — matches AnswerState in take-assessment-view.tsx. */
export interface SubmittedAnswer {
  optionIndex?: number
  optionIndices?: number[]
  openText?: string
}

/**
 * Synthetic question id a PROJECT submission is keyed under inside the same
 * openAnswers/openScores shape OPEN questions use server-side (see
 * app/api/assessment-attempts/route.ts's PROJECT branch, which stores the
 * submission under `openAnswers.project`).
 */
export const PROJECT_SUBMISSION_KEY = 'project'

/**
 * Fetches the signed-in member's own assessment-attempt history from the
 * real /api/assessment-attempts, filtered by their session userId —
 * replaces the module-level mock store. Grading/scoring, and the resulting
 * certificate-eligibility side effect, all now happen server-side (see
 * app/api/assessment-attempts/route.ts and [id]/route.ts), mirroring
 * use-borrowings.ts's per-component fetch pattern.
 */
export function useAssessmentAttempts() {
  const { user } = useAuth()
  const [data, setData] = useState<AssessmentAttempt[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/assessment-attempts?userId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}

/**
 * Submits a QUIZ/EXAM attempt's raw per-question answers to the real
 * POST /api/assessment-attempts, which auto-grades SINGLE_SELECT/
 * MULTI_SELECT questions and stores OPEN answers verbatim for later review
 * server-side (see that route's docstring — it ports this file's former
 * client-side grading logic).
 */
export async function recordAssessmentAttempt(
  userId: string,
  assessmentId: string,
  answers: Record<string, SubmittedAnswer>
): Promise<AssessmentAttempt> {
  const singleSelect: Record<string, number> = {}
  const multiSelect: Record<string, number[]> = {}
  const openAnswers: Record<string, string> = {}
  for (const [questionId, answer] of Object.entries(answers)) {
    if (answer.optionIndex !== undefined) singleSelect[questionId] = answer.optionIndex
    if (answer.optionIndices !== undefined) multiSelect[questionId] = answer.optionIndices
    if (answer.openText !== undefined) openAnswers[questionId] = answer.openText
  }
  const res = await fetch('/api/assessment-attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, assessmentId, answers: { ...singleSelect, ...multiSelect }, openAnswers }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not submit assessment')
  return json.data
}

/** Submits a PROJECT (hackathon-style) submission — always lands PENDING_REVIEW server-side. */
export async function recordProjectSubmission(userId: string, assessmentId: string, submissionText: string): Promise<AssessmentAttempt> {
  const res = await fetch('/api/assessment-attempts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, assessmentId, submission: submissionText }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not submit your project')
  return json.data
}
