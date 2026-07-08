'use client'

import { useSyncExternalStore } from 'react'
import {
  initialAssessmentAttempts,
  type AssessmentAttempt, type AssessmentAttemptStatus, type AttemptStatus,
} from './enrollment-data'
import { applyAttemptOutcome } from './use-enrollments'
import type { Question } from './assessment-data'

/** One member's submitted answer to a single question — matches AnswerState in take-assessment-view.tsx. */
export interface SubmittedAnswer {
  optionIndex?: number
  optionIndices?: number[]
  openText?: string
}

/**
 * Module-level mutable store for assessment-attempt history, separate from
 * use-enrollments.ts (which owns course enrollment/lesson-progress state)
 * purely to keep both files under this project's 200-line-per-file limit —
 * they share one course-eligibility side effect via `applyAttemptOutcome`.
 */
let attempts: AssessmentAttempt[] = [...initialAssessmentAttempts]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getAttemptsSnapshot() {
  return attempts
}

/**
 * Records an assessment attempt from the member's raw per-question answers.
 * Auto-gradable questions (SINGLE_SELECT/MULTI_SELECT) are scored here;
 * OPEN answers are stored verbatim (never discarded) and contribute 0 to
 * the running score until a manager grades them. An attempt with any OPEN
 * question lands as PENDING_REVIEW — its pass/fail `status` is provisional
 * (computed against the partial score) and is NOT applied to the
 * enrollment's certificate eligibility until `gradeOpenAnswers` finalizes
 * it, so a still-pending attempt can never look "passed" early.
 */
export function recordAssessmentAttempt(assessmentId: string, courseId: string, questions: Question[], answers: Record<string, SubmittedAnswer>) {
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
  const openAnswers: Record<string, string> = {}
  let score = 0

  for (const q of questions) {
    const answer = answers[q.id]
    if (q.type === 'SINGLE_SELECT') {
      if (answer?.optionIndex === q.correctOptionIndex) score += q.marks
    } else if (q.type === 'MULTI_SELECT') {
      const correct = q.correctOptionIndices ?? []
      const submitted = answer?.optionIndices ?? []
      const isExactMatch = correct.length > 0 && submitted.length === correct.length && submitted.every((i) => correct.includes(i))
      if (isExactMatch) score += q.marks
    } else {
      openAnswers[q.id] = answer?.openText ?? ''
    }
  }

  const hasOpenQuestions = questions.some((q) => q.type === 'OPEN')
  const reviewStatus: AttemptStatus = hasOpenQuestions ? 'PENDING_REVIEW' : 'AUTO_GRADED'
  const status: AssessmentAttemptStatus = totalMarks > 0 && score / totalMarks >= 0.5 ? 'PASSED' : 'FAILED'

  const attempt: AssessmentAttempt = {
    assessmentId, status, reviewStatus, score, totalMarks,
    takenAt: new Date().toISOString().slice(0, 10),
    openAnswers: hasOpenQuestions ? openAnswers : undefined,
  }
  attempts = [attempt, ...attempts.filter((a) => a.assessmentId !== assessmentId)]

  if (reviewStatus === 'AUTO_GRADED') {
    applyAttemptOutcome(courseId, status)
  }

  emitChange()
  return attempt
}

/**
 * Synthetic question id used to key a PROJECT submission's text/link inside
 * the same `openAnswers`/`openScores` `Record<string, string|number>` shape
 * OPEN questions already use — a PROJECT assessment has no real question
 * ids (`questions` is empty), but the shapes are otherwise identical (one
 * answer, one manager-entered score), so reusing them avoids a third
 * parallel answer-storage field on `AssessmentAttempt`.
 */
export const PROJECT_SUBMISSION_KEY = 'project'

/**
 * Records a PROJECT (hackathon-style) submission. Always PENDING_REVIEW —
 * there is no correct answer to compare a text/link submission against, so
 * unlike SINGLE_SELECT/MULTI_SELECT (and even OPEN, which still contributes
 * an auto-graded 0 alongside other auto-gradable questions), a PROJECT
 * attempt has zero auto-graded component and never calls
 * `applyAttemptOutcome` at submission time — only `gradeOpenAnswers` (via
 * the review queue) can finalize it.
 */
export function recordProjectSubmission(assessmentId: string, projectMarks: number, submissionText: string) {
  const attempt: AssessmentAttempt = {
    assessmentId,
    status: 'FAILED', // provisional — score is always 0/projectMarks pre-review, same math recordAssessmentAttempt would produce
    reviewStatus: 'PENDING_REVIEW',
    score: 0,
    totalMarks: projectMarks,
    takenAt: new Date().toISOString().slice(0, 10),
    openAnswers: { [PROJECT_SUBMISSION_KEY]: submissionText },
  }
  attempts = [attempt, ...attempts.filter((a) => a.assessmentId !== assessmentId)]
  emitChange()
  return attempt
}

/**
 * A manager grades a PENDING_REVIEW attempt's OPEN questions (one score per
 * question, bounded by that question's marks by the caller/UI), finalizes
 * its total score and pass/fail status, and — only now — applies the
 * outcome to certificate eligibility, matching the same path an
 * auto-graded PASSED attempt already goes through. Also used for PROJECT
 * attempts, keyed by `PROJECT_SUBMISSION_KEY` with `autoGradedScore` always 0.
 */
export function gradeOpenAnswers(assessmentId: string, courseId: string, openScores: Record<string, number>, autoGradedScore: number, totalMarks: number) {
  const openTotal = Object.values(openScores).reduce((sum, s) => sum + s, 0)
  const score = autoGradedScore + openTotal
  const status: AssessmentAttemptStatus = totalMarks > 0 && score / totalMarks >= 0.5 ? 'PASSED' : 'FAILED'

  attempts = attempts.map((a) =>
    a.assessmentId === assessmentId ? { ...a, status, reviewStatus: 'GRADED', score, openScores } : a
  )

  applyAttemptOutcome(courseId, status)
  emitChange()
}

/** Live-subscribes to the shared assessment-attempt history. */
export function useAssessmentAttempts() {
  return useSyncExternalStore(subscribe, getAttemptsSnapshot, () => initialAssessmentAttempts)
}
