import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { certificateIssuedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Server-side port of the mock's `issueCertificate` auto-issuance rule
 * (app/dashboard/e-learning/certificates/_components/use-certificates.ts):
 * once an Enrollment's `status` is COMPLETED and `assessmentPassed` is
 * true, a Certificate is issued automatically — no separate admin
 * approval step, since eligibility already encodes the real approval
 * condition. Deduplicates per user+course, matching the same guard
 * `POST /api/certificates` already enforces. Called from every write path
 * that can flip eligibility to true: `PATCH /api/enrollments/[id]`
 * (`completeLesson`/`markAssessmentPassed`), the auto-graded branch of
 * `POST /api/assessment-attempts`, and `PATCH /api/assessment-attempts/[id]`
 * (`gradeOpenAnswers`).
 */
export async function issueCertificateIfEligible(userId: string, courseId: string): Promise<void> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { course: { select: { title: true } }, user: { select: { name: true, firstName: true, lastName: true } } },
  })
  if (!enrollment || enrollment.status !== 'COMPLETED' || !enrollment.assessmentPassed) return

  const already = await prisma.certificate.findFirst({ where: { userId, courseId } })
  if (already) return

  const memberName = enrollment.user.name ?? `${enrollment.user.firstName ?? ''} ${enrollment.user.lastName ?? ''}`.trim()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  const certificate = await prisma.certificate.create({
    data: {
      userId,
      memberName,
      courseId,
      courseTitle: enrollment.course.title,
      verificationCode: `KLS-${part()}-${part()}`,
    },
  })

  const certificateUrl = `${appBaseUrl()}/member/certificates/${certificate.id}`
  await notifyUser({
    userId,
    type: 'COURSE',
    title: 'Certificate issued',
    message: `You've earned a certificate for completing "${enrollment.course.title}".`,
    href: `/member/certificates/${certificate.id}`,
    email: { subject: 'Your certificate is ready', html: certificateIssuedEmailHtml(memberName, enrollment.course.title, certificateUrl) },
  })
}
