import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { consumeEmailVerificationToken } from '@/lib/verification-tokens'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'

const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  token: z.string().min(1, 'Token is required'),
})

/** Confirms a real verification token (see /api/auth/register) and stamps User.emailVerified. Single-use — the token is deleted on consumption, valid or not, so it can never be replayed. */
export const POST = withErrorHandling('/api/auth/verify-email', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'auth:verify-email', { max: 10, windowMs: 15 * 60 * 1000 })

  const parsed = verifyEmailSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { email, token } = parsed.data

  const valid = await consumeEmailVerificationToken(email, token)
  if (!valid) {
    throw new ApiError('This verification link is invalid or has expired', 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new ApiError('No account found for this email', 404)
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } })

  return NextResponse.json({ data: null, message: 'Email verified successfully', code: 'success', status: 200 })
})
