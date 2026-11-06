import { randomInt } from 'node:crypto'
import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { certificateIssuedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Creating certificates — shared by the automatic issue on completion
 * (app/api/_shared/issue-certificate-if-eligible.ts) and the admin
 * "Issue certificates" action for everyone who finished a course.
 */

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const codePart = () => Array.from({ length: 4 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('')

const nameOf = (u: { name: string | null; firstName: string | null; lastName: string | null }) =>
  (u.name || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()) || 'Member'

/** Creates one certificate (unique code, retried on a clash) and tells the member. Returns null if they already have one for the course. */
export async function createCertificate(input: { userId: string; courseId: string; memberName: string; courseTitle: string }) {
  if (await prisma.certificate.findFirst({ where: { userId: input.userId, courseId: input.courseId }, select: { id: true } })) return null
  let certificate = null
  for (let i = 0; i < 5 && !certificate; i++) {
    try {
      certificate = await prisma.certificate.create({ data: { ...input, verificationCode: `KLS-${codePart()}-${codePart()}` } })
    } catch (e) {
      if ((e as { code?: string }).code !== 'P2002') throw e
    }
  }
  if (!certificate) throw new Error('Could not create a unique certificate code')

  // Two paths can issue at the same moment (the member finishing + an admin's "issue all"):
  // keep the oldest certificate for this member + course and drop ours without notifying.
  const all = await prisma.certificate.findMany({ where: { userId: input.userId, courseId: input.courseId }, orderBy: [{ issuedAt: 'asc' }, { id: 'asc' }], select: { id: true } })
  if (all.length > 1 && all[0].id !== certificate.id) {
    await prisma.certificate.delete({ where: { id: certificate.id } }).catch(() => {})
    return null
  }

  const url = `${appBaseUrl().replace(/\/+$/, '')}/member/certificates/${certificate.id}`
  await notifyUser({
    userId: input.userId,
    type: 'COURSE',
    category: 'certificate-issued',
    title: 'Certificate issued',
    message: `You've earned a certificate for completing "${input.courseTitle}".`,
    href: `/member/certificates/${certificate.id}`,
    email: { subject: 'Your certificate is ready', html: certificateIssuedEmailHtml(input.memberName, input.courseTitle, url) },
  }).catch(() => {})
  return certificate
}

export interface PendingCertificate {
  enrollmentId: string
  userId: string
  memberName: string
  courseId: string
  courseTitle: string
  /** False when the course's final exam was not passed (or the course has none). */
  assessmentPassed: boolean
  completedAt: string
}

/** Members who completed a course but have no certificate for it yet (one query each, no per-row lookups). */
export async function listPendingCertificates(): Promise<PendingCertificate[]> {
  const [completed, existing] = await Promise.all([
    prisma.enrollment.findMany({
      where: { status: 'COMPLETED', course: { is: {} }, user: { is: {} } },
      select: { id: true, userId: true, courseId: true, assessmentPassed: true, updatedAt: true, course: { select: { title: true } }, user: { select: { name: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 2000,
    }),
    prisma.certificate.findMany({ select: { userId: true, courseId: true } }),
  ])
  const has = new Set(existing.map((c) => `${c.userId}:${c.courseId}`))
  return completed
    .filter((e) => !has.has(`${e.userId}:${e.courseId}`))
    .map((e) => ({
      enrollmentId: e.id, userId: e.userId, memberName: nameOf(e.user), courseId: e.courseId, courseTitle: e.course.title,
      assessmentPassed: e.assessmentPassed, completedAt: e.updatedAt.toISOString(),
    }))
}

/** Issues certificates to every member who completed a course and has none yet (or only the given enrollments). */
export async function issuePendingCertificates(onlyEnrollmentIds?: string[]): Promise<{ issued: number; skipped: number }> {
  const pending = await listPendingCertificates()
  const chosen = onlyEnrollmentIds?.length ? pending.filter((p) => onlyEnrollmentIds.includes(p.enrollmentId)) : pending
  let issued = 0
  let skipped = 0
  for (const p of chosen) {
    const c = await createCertificate({ userId: p.userId, courseId: p.courseId, memberName: p.memberName, courseTitle: p.courseTitle })
    if (c) issued++; else skipped++
  }
  return { issued, skipped }
}
