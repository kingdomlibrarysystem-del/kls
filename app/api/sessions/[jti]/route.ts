import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** Revokes one session/device — the next time that session's jwt callback runs (its next request), lib/auth-options.ts's revocation check will reject it. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ jti: string }> }) {
  const { jti } = await params
  const existing = await prisma.userSession.findUnique({ where: { jti } })
  if (!existing || existing.revokedAt) {
    return NextResponse.json({ data: null, message: 'Session not found', code: 'error', status: 404 }, { status: 404 })
  }

  const auth = await requireOwnerOrStaff(existing.userId)
  if (auth.response) return auth.response

  await prisma.userSession.update({ where: { jti }, data: { revokedAt: new Date() } })
  return NextResponse.json({ data: null, message: 'Session revoked successfully', code: 'success', status: 200 })
}
