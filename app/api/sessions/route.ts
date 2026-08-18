import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Real Sessions & Devices API, backed by UserSession (see
 * lib/auth-options.ts's jwt callback for how rows are created/enforced).
 * Only non-revoked sessions are listed — a revoked session is
 * functionally gone the moment its row is marked, so there's no reason
 * to show it in an "active sessions" list.
 */
function serializeSession(s: { jti: string; userAgent: string; ip: string; lastActive: Date; createdAt: Date }) {
  return {
    id: s.jti,
    device: s.userAgent,
    location: s.ip,
    lastActive: s.lastActive.toISOString().replace('T', ' ').slice(0, 16),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const currentJti = searchParams.get('currentJti')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const sessions = await prisma.userSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastActive: 'desc' },
  })

  return NextResponse.json({
    data: sessions.map((s) => ({ ...serializeSession(s), current: s.jti === currentJti })),
    message: 'Sessions fetched successfully',
    code: 'success',
    status: 200,
  })
}
