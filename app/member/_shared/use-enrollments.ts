'use client'

import { useSyncExternalStore } from 'react'
import {
  initialEnrollments, initialAssessmentAttempts,
  type CourseEnrollment, type AssessmentAttempt, type AssessmentAttemptStatus,
} from './enrollment-data'
import { getLessonsSnapshot } from './use-lessons'

/**
 * Module-level mutable store so Browse Courses, My Courses, the lesson
 * viewer, and the assessments flow all share one enrollment/progress state
 * across route navigations, without a backend. Enrollment/progress itself
 * is member-only state — not shared with the admin course-catalog store —
 * but this module reads the shared lesson catalog (use-lessons.ts) so
 * "next lesson" reflects any admin edits/reordering.
 */
let enrollments: CourseEnrollment[] = [...initialEnrollments]
let attempts: AssessmentAttempt[] = [...initialAssessmentAttempts]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getEnrollmentsSnapshot() {
  return enrollments
}

function getAttemptsSnapshot() {
  return attempts
}

/** Percentage complete, derived from completedLessonIds — never stored directly. */
export function getProgressPercent(enrollment: CourseEnrollment): number {
  return enrollment.totalLessons > 0
    ? Math.round((enrollment.completedLessonIds.length / enrollment.totalLessons) * 100)
    : 0
}

/** A course is eligible for certificate issuance once fully completed and its assessment is passed. */
export function isCertificateEligible(enrollment: CourseEnrollment): boolean {
  return enrollment.status === 'COMPLETED' && enrollment.assessmentPassed
}

/** The first lesson not yet in completedLessonIds, or the course's first lesson if all are complete. */
export function getNextLessonId(enrollment: CourseEnrollment): string | undefined {
  const lessons = getLessonsSnapshot()[enrollment.courseId]?.lessons
  if (!lessons || lessons.length === 0) return undefined
  const next = lessons.find((l) => !enrollment.completedLessonIds.includes(l.id))
  return (next ?? lessons[0]).id
}

/** Enrolls in a course if not already enrolled; no-op (returns existing row) if already enrolled. */
export function enrollInCourse(courseId: string, totalLessons: number): CourseEnrollment {
  const existing = enrollments.find((e) => e.courseId === courseId)
  if (existing) return existing
  const created: CourseEnrollment = {
    courseId,
    status: 'ENROLLED',
    enrolledAt: new Date().toISOString().slice(0, 10),
    completedLessonIds: [],
    totalLessons,
    assessmentPassed: false,
  }
  enrollments = [created, ...enrollments]
  emitChange()
  return created
}

/** Marks a lesson complete for a course's enrollment; auto-flips status to COMPLETED once every lesson is done. */
export function markLessonComplete(courseId: string, lessonId: string) {
  enrollments = enrollments.map((e) => {
    if (e.courseId !== courseId) return e
    if (e.completedLessonIds.includes(lessonId)) return e
    const completedLessonIds = [...e.completedLessonIds, lessonId]
    const status: CourseEnrollment['status'] = completedLessonIds.length >= e.totalLessons ? 'COMPLETED' : 'ENROLLED'
    return { ...e, completedLessonIds, status }
  })
  emitChange()
}

/** Records an assessment attempt and, if passed, marks the linked course's enrollment eligible for a certificate. */
export function recordAssessmentAttempt(assessmentId: string, courseId: string, score: number, totalMarks: number) {
  const status: AssessmentAttemptStatus = totalMarks > 0 && score / totalMarks >= 0.5 ? 'PASSED' : 'FAILED'
  const attempt: AssessmentAttempt = { assessmentId, status, score, totalMarks, takenAt: new Date().toISOString().slice(0, 10) }
  attempts = [attempt, ...attempts.filter((a) => a.assessmentId !== assessmentId)]
  if (status === 'PASSED') {
    enrollments = enrollments.map((e) => (e.courseId === courseId ? { ...e, assessmentPassed: true } : e))
  }
  emitChange()
  return attempt
}

/** Live-subscribes to the shared enrollment store. */
export function useEnrollments() {
  return useSyncExternalStore(subscribe, getEnrollmentsSnapshot, () => initialEnrollments)
}

/** Live-subscribes to the shared assessment-attempt history. */
export function useAssessmentAttempts() {
  return useSyncExternalStore(subscribe, getAttemptsSnapshot, () => initialAssessmentAttempts)
}
