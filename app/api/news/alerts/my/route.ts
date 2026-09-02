import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** The hinted GET /api/news/alerts/my — member's own subscribed publication alerts. */
function serializeSubscription(s: { id: string; userId: string; category: string | null }) {
  return { id: s.id, userId: s.userId, category: s.category }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const subscriptions = await prisma.newsSubscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })

  return NextResponse.json({
    data: subscriptions.map(serializeSubscription),
    message: 'Alerts fetched successfully',
    code: 'success',
    status: 200,
  })
}
