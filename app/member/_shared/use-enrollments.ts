'use client'

import { useSyncExternalStore } from 'react'
import { initialEnrollments, type CourseEnrollment, type AssessmentAttemptStatus } from './enrollment-data'
import { getLessonsSnapshot } from './use-lessons'
import { courseCatalog } from './course-catalog-data'
import { issueCertificate } from '@/app/dashboard/e-learning/certificates/_components/use-certificates'

/**
 * This mock auth system has a single member persona ("John Doe") — see
 * contexts/auth-context.tsx's mockUsers.member. Certificate issuance needs
 * a member display name, but this module is a plain store (not a React
 * component), so it can't call useAuth(); hardcoding the one mock member
 * name here mirrors how CONTRIBUTOR_NAME is used on the contributor side.
 */
const CURRENT_MEMBER_NAME = 'John Doe'

/**
 * Module-level mutable store so Browse Courses, My Courses, the lesson
 * viewer, and the assessments flow all share one enrollment/progress state
 * across route navigations, without a backend. Enrollment/progress itself
 * is member-only state — not shared with the admin course-catalog store —
 * but this module reads the shared lesson catalog (use-lessons.ts) so
 * "next lesson" reflects any admin edits/reordering.
 */
let enrollments: CourseEnrollment[] = [...initialEnrollments]
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

/**
 * Marks a lesson complete for a course's enrollment; auto-flips status to
 * COMPLETED once every lesson is done, and issues a certificate if that
 * completion is what flips eligibility to true (e.g. the member already
 * passed the assessment before finishing the last lesson).
 */
export function markLessonComplete(courseId: string, lessonId: string) {
  const before = enrollments.find((e) => e.courseId === courseId)
  const wasEligible = !!before && isCertificateEligible(before)

  enrollments = enrollments.map((e) => {
    if (e.courseId !== courseId) return e
    if (e.completedLessonIds.includes(lessonId)) return e
    const completedLessonIds = [...e.completedLessonIds, lessonId]
    const status: CourseEnrollment['status'] = completedLessonIds.length >= e.totalLessons ? 'COMPLETED' : 'ENROLLED'
    return { ...e, completedLessonIds, status }
  })

  const after = enrollments.find((e) => e.courseId === courseId)
  if (after && !wasEligible && isCertificateEligible(after)) {
    const course = courseCatalog.find((c) => c.id === courseId)
    if (course) issueCertificate(CURRENT_MEMBER_NAME, course.title, courseId)
  }

  emitChange()
}

/**
 * Re-flips `assessmentPassed` on a course's enrollment when a PASSED
 * attempt lands, and issues a certificate the moment that flips eligibility
 * from false to true (see use-certificates.ts's `issueCertificate`
 * docstring for why issuance is automatic rather than a manual admin
 * approval step). Exported for use-assessment-attempts.ts, which calls this
 * from both the auto-graded path and the post-review grading path — pass/
 * fail can become final at either point depending on whether the attempt
 * had OPEN questions.
 */
export function applyAttemptOutcome(courseId: string, status: AssessmentAttemptStatus) {
  const before = enrollments.find((e) => e.courseId === courseId)
  const wasEligible = !!before && isCertificateEligible(before)

  if (status === 'PASSED') {
    enrollments = enrollments.map((e) => (e.courseId === courseId ? { ...e, assessmentPassed: true } : e))
  }

  const after = enrollments.find((e) => e.courseId === courseId)
  if (after && !wasEligible && isCertificateEligible(after)) {
    const course = courseCatalog.find((c) => c.id === courseId)
    if (course) issueCertificate(CURRENT_MEMBER_NAME, course.title, courseId)
  }
  emitChange()
}

/** Live-subscribes to the shared enrollment store. */
export function useEnrollments() {
  return useSyncExternalStore(subscribe, getEnrollmentsSnapshot, () => initialEnrollments)
}
