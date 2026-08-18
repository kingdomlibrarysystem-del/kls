import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Real Login History API, per APP_DOC Task 1.7 — replacing both
 * app/dashboard/profile/_components/security-mock-data.ts and
 * app/member/profile/_components/security-mock-data.ts's identical
 * mockLoginHistory arrays. Rows are written from
 * lib/auth-options.ts's authorize() on every real login attempt, not by
 * this route (this route is read-only).
 */
function serializeLoginEvent(e: {
  id: string
  ip: string
  userAgent: string
  success: boolean
  createdAt: Date
}) {
  return {
    id: e.id,
    date: e.createdAt.toISOString().replace('T', ' ').slice(0, 16),
    ip: e.ip,
    device: e.userAgent,
    success: e.success,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const events = await prisma.loginHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({
    data: events.map(serializeLoginEvent),
    message: 'Login history fetched successfully',
    code: 'success',
    status: 200,
  })
}
