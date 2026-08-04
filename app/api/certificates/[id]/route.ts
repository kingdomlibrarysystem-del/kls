import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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
  return NextResponse.json({ data: serializeCertificate(certificate), message: 'Certificate fetched successfully', code: 'success', status: 200 })
}

/** action: 'revoke' | 'restore' toggles revoked status as an explicit, guarded transition rather than a blanket field update. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.certificate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Certificate not found', code: 'error', status: 404 }, { status: 404 })
    }
    if (body.action === 'revoke') {
      const updated = await prisma.certificate.update({ where: { id }, data: { revoked: true } })
      return NextResponse.json({ data: serializeCertificate(updated), message: 'Certificate revoked', code: 'success', status: 200 })
    }
    if (body.action === 'restore') {
      const updated = await prisma.certificate.update({ where: { id }, data: { revoked: false } })
      return NextResponse.json({ data: serializeCertificate(updated), message: 'Certificate restored', code: 'success', status: 200 })
    }
    return NextResponse.json({ data: null, message: 'Unknown action', code: 'error', status: 400 }, { status: 400 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update certificate', code: 'error', status: 500 }, { status: 500 })
  }
}
