import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeCertificate(c: {
  id: string
  userId: string
  memberName: string
  courseId: string | null
  courseTitle: string
  issuedAt: Date
  verificationCode: string
  revoked: boolean
}) {
  return {
    id: c.id,
    userId: c.userId,
    member: c.memberName,
    courseId: c.courseId ?? undefined,
    course: c.courseTitle,
    issuedAt: c.issuedAt.toISOString().split('T')[0],
    verificationCode: c.verificationCode,
    revoked: c.revoked,
  }
}

/** One certificate in the GET /api/certificates/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getCertificateDetail(id: string) {
  if (!isObjectId(id)) return null
  const certificate = await prisma.certificate.findUnique({ where: { id } })
  return certificate ? { ownerId: certificate.userId, certificate: serializeCertificate(certificate) } : null
}
