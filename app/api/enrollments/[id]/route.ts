import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { issueCertificateIfEligible } from '@/app/api/_shared/issue-certificate-if-eligible'

function serializeEnrollment(e: {
  id: string
  userId: string
  user: { name: string | null; firstName: string | null; lastName: string | null }
  courseId: string
  course: { title: string }
  status: string
  enrolledAt: Date
  completedLessonIds: string[]
  totalLessons: number
  assessmentPassed: boolean
}) {
  const memberName = e.user.name ?? `${e.user.firstName ?? ''} ${e.user.lastName ?? ''}`.trim()
  const progress = e.totalLessons > 0 ? Math.round((e.completedLessonIds.length / e.totalLessons) * 100) : 0
  return {
    id: e.id,
    userId: e.userId,
    member: memberName,
    courseId: e.courseId,
    courseTitle: e.course.title,
    enrolledAt: e.enrolledAt.toISOString().split('T')[0],
    status: e.status,
    progress,
    completedLessonIds: e.completedLessonIds,
    totalLessons: e.totalLessons,
    assessmentPassed: e.assessmentPassed,
  }
}

const INCLUDE = { user: { select: { name: true, firstName: true, lastName: true } }, course: { select: { title: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const enrollment = await prisma.enrollment.findUnique({ where: { id }, include: INCLUDE })
  if (!enrollment) {
    return NextResponse.json({ data: null, message: 'Enrollment not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeEnrollment(enrollment), message: 'Enrollment fetched successfully', code: 'success', status: 200 })
}

/**
 * `action: 'completeLesson'` ports the member lesson viewer's mark-
 * complete behavior — adds a lessonId to completedLessonIds (idempotent,
 * no duplicate entries) and auto-flips status to COMPLETED once every
 * lesson is done, matching the mock's own completion semantics.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.enrollment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Enrollment not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.action === 'completeLesson') {
      if (!body.lessonId) {
        return NextResponse.json({ data: null, message: 'Missing required field: lessonId', code: 'error', status: 400 }, { status: 400 })
      }
      const completedLessonIds = existing.completedLessonIds.includes(body.lessonId)
        ? existing.completedLessonIds
        : [...existing.completedLessonIds, body.lessonId]
      const status = completedLessonIds.length >= existing.totalLessons ? 'COMPLETED' : 'ENROLLED'
      const updated = await prisma.enrollment.update({ where: { id }, data: { completedLessonIds, status }, include: INCLUDE })
      await issueCertificateIfEligible(updated.userId, updated.courseId)
      return NextResponse.json({ data: serializeEnrollment(updated), message: 'Lesson marked complete', code: 'success', status: 200 })
    }

    if (body.action === 'markAssessmentPassed') {
      const updated = await prisma.enrollment.update({ where: { id }, data: { assessmentPassed: true }, include: INCLUDE })
      await issueCertificateIfEligible(updated.userId, updated.courseId)
      return NextResponse.json({ data: serializeEnrollment(updated), message: 'Enrollment updated successfully', code: 'success', status: 200 })
    }

    const data: Record<string, unknown> = { ...body }
    delete data.action
    delete data.id
    delete data.userId
    delete data.courseId
    if (typeof data.status === 'string') data.status = data.status.toUpperCase()
    const updated = await prisma.enrollment.update({ where: { id }, data, include: INCLUDE })
    return NextResponse.json({ data: serializeEnrollment(updated), message: 'Enrollment updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update enrollment', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.enrollment.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Enrollment not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.enrollment.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Enrollment deleted successfully', code: 'success', status: 200 })
}
