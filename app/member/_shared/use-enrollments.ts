'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

/** Real Enrollment shape, matching /api/enrollments' serializeEnrollment (see app/api/enrollments/route.ts). */
export interface CourseEnrollment {
  id: string
  userId: string
  courseId: string
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED'
  /** ISO date, stamped when the learner enrolls. */
  enrolledAt: string
  completedLessonIds: string[]
  totalLessons: number
  assessmentPassed: boolean
  paid: boolean
}

/**
 * Fetches the signed-in member's own enrollments from the real
 * /api/enrollments, filtered by their session userId — replaces the
 * module-level mock store in the old enrollment-data.ts/use-enrollments.ts.
 * Certificate issuance (once eligible) now happens server-side, as a side
 * effect of the real `completeLesson`/`markAssessmentPassed`/
 * `gradeOpenAnswers` write paths (see app/api/_shared/issue-certificate-if-eligible.ts)
 * — this hook only reads/writes enrollment state, mirroring
 * use-borrowings.ts's per-component fetch pattern.
 */
export function useEnrollments() {
  const { user } = useAuth()
  const [data, setData] = useState<CourseEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/enrollments?userId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
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
export function getNextLessonId(enrollment: CourseEnrollment, lessons: { id: string }[] | undefined): string | undefined {
  if (!lessons || lessons.length === 0) return undefined
  const next = lessons.find((l) => !enrollment.completedLessonIds.includes(l.id))
  return (next ?? lessons[0]).id
}

/** Enrolls the given user in a course via a real POST /api/enrollments. Throws if already enrolled (real 409) or on any other failure. */
export async function enrollInCourse(userId: string, courseId: string): Promise<CourseEnrollment> {
  const res = await fetch('/api/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not enroll in this course')
  return json.data
}

/** Marks a lesson complete via a real PATCH /api/enrollments/[id] — the API auto-flips status to COMPLETED and issues a certificate server-side once eligible. */
export async function markLessonComplete(enrollmentId: string, lessonId: string): Promise<CourseEnrollment> {
  const res = await fetch(`/api/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'completeLesson', lessonId }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not mark lesson complete')
  return json.data
}

/** Real unenroll via PATCH /api/enrollments/[id] — sets status to DROPPED (the enum value already existed, just never had a UI path to reach it). */
export async function unenrollFromCourse(enrollmentId: string): Promise<CourseEnrollment> {
  const res = await fetch(`/api/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unenroll' }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not unenroll from this course')
  return json.data
}
