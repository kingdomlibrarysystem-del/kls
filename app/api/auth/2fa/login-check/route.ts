import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'

const loginCheckSchema = z.object({ email: z.string().email() })

/**
 * Pre-flight check the login form calls before submitting credentials —
 * tells the frontend whether to render a TOTP code field, since NextAuth's
 * authorize() only gets one shot at the submitted credentials and can't
 * itself ask the user for a second field mid-flow. Never reveals whether
 * the email is a real account (constant response shape either way) to
 * avoid this becoming an account-enumeration oracle.
 */
export const POST = withErrorHandling('/api/auth/2fa/login-check', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'auth:2fa-login-check', { max: 20, windowMs: 15 * 60 * 1000 })

  const parsed = loginCheckSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { twoFactorSecret: { select: { enabled: true } } },
  })

  return NextResponse.json({
    data: { requiresTotp: !!user?.twoFactorSecret?.enabled },
    message: 'Checked successfully',
    code: 'success',
    status: 200,
  })
})
