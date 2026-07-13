'use client'

import { useSyncExternalStore } from 'react'
import { initialTakeableAssessments, type TakeableAssessment, type Question, type ProjectSubmissionFormat } from './assessment-data'

/**
 * Module-level mutable store so the member take-assessment flow and the
 * admin Quizzes & Exams management page (/dashboard/e-learning/quizzes)
 * share one assessment catalog across route navigations, without a
 * backend. An admin edit here must be visible to the member taking the
 * quiz/exam, so this is intentionally NOT scoped to admin-only.
 */
let assessments: Record<string, TakeableAssessment> = structuredClone(initialTakeableAssessments)
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return assessments
}

function nextAssessmentId() {
  const max = Object.keys(assessments).reduce((m, id) => {
    const n = Number(id)
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return String(max + 1)
}

export interface AddAssessmentInput {
  title: string
  kind: TakeableAssessment['kind']
  courseId: string
  durationSeconds?: number
  questions: Question[]
  /** PROJECT only. */
  brief?: string
  submissionFormat?: ProjectSubmissionFormat
  projectMarks?: number
}

/** Creates a new quiz/exam and adds it to the shared catalog. */
export function addAssessment(input: AddAssessmentInput): TakeableAssessment {
  const created: TakeableAssessment = { id: nextAssessmentId(), ...input }
  assessments = { ...assessments, [created.id]: created }
  emitChange()
  return created
}

export function updateAssessment(id: string, updates: Partial<AddAssessmentInput>) {
  const existing = assessments[id]
  if (!existing) return
  assessments = { ...assessments, [id]: { ...existing, ...updates } }
  emitChange()
}

export function removeAssessment(id: string) {
  const { [id]: _removed, ...rest } = assessments
  assessments = rest
  emitChange()
}

/** Live-subscribes to the shared assessment catalog, keyed by assessment ID. */
export function useAssessmentCatalog() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialTakeableAssessments)
}
