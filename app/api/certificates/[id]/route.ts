import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

function serializeCertificate(c: {
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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const certificate = await prisma.certificate.findUnique({ where: { id } })
  if (!certificate) {
    return NextResponse.json({ data: null, message: 'Certificate not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(certificate.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeCertificate(certificate), message: 'Certificate fetched successfully', code: 'success', status: 200 })
}

const patchCertificateSchema = z.object({ action: z.enum(['revoke', 'restore']) })

/** action: 'revoke' | 'restore' toggles revoked status as an explicit, guarded transition rather than a blanket field update. */
export const PATCH = withErrorHandling('/api/certificates/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchCertificateSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const existing = await prisma.certificate.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Certificate not found', 404)

  const revoked = parsed.data.action === 'revoke'
  const updated = await prisma.certificate.update({ where: { id }, data: { revoked } })
  return NextResponse.json({ data: serializeCertificate(updated), message: revoked ? 'Certificate revoked' : 'Certificate restored', code: 'success', status: 200 })
})
