import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireAuth } from '@/lib/auth/require-role'

/** Reports whether the signed-in user has 2FA enabled — never returns the secret itself. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const auth = await requireAuth()
  if (auth.response) return auth.response
  if (auth.session.userId !== userId) {
    return NextResponse.json({ data: null, message: 'You can only check your own two-factor status.', code: 'error', status: 403 }, { status: 403 })
  }

  const record = await prisma.twoFactorSecret.findUnique({ where: { userId }, select: { enabled: true } })

  return NextResponse.json({
    data: { enabled: !!record?.enabled },
    message: 'Two-factor status fetched successfully',
    code: 'success',
    status: 200,
  })
}
