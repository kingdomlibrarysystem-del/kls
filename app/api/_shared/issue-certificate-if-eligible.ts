import prisma from '@/prisma/client'
import { createCertificate } from '@/lib/certificates/issue'
import { certificateEligible } from '@/lib/data/enrollment-progress'

/**
 * Automatic issue on completion: once an Enrollment is COMPLETED and its
 * course's final exam is passed — or the course has no final exam — a
 * Certificate is issued (one per user + course). Called from every write path that can make a member eligible:
 * `PATCH /api/enrollments/[id]`, the auto-graded branch of
 * `POST /api/assessment-attempts`, and `PATCH /api/assessment-attempts/[id]`.
 * Admins can also issue certificates to everyone who completed a course
 * (exam or not) from /dashboard/e-learning/certificates.
 */
export async function issueCertificateIfEligible(userId: string, courseId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { course: { select: { title: true } }, user: { select: { name: true, firstName: true, lastName: true } } },
  })
  if (!enrollment || !(await certificateEligible(enrollment))) return
  const memberName = (enrollment.user.name || `${enrollment.user.firstName ?? ''} ${enrollment.user.lastName ?? ''}`.trim()) || 'Member'
  await createCertificate({ userId, courseId, memberName, courseTitle: enrollment.course.title })
}
