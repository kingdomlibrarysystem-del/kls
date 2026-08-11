import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/client'
import { consumePasswordResetToken } from '@/lib/verification-tokens'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

const BCRYPT_ROUNDS = 10

/** Confirms a real reset token and sets a new bcrypt-hashed password. Single-use — the token is deleted on consumption, valid or not. */
export const POST = withErrorHandling('/api/auth/reset-password', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'auth:reset-password', { max: 10, windowMs: 15 * 60 * 1000 })

  const parsed = resetPasswordSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { email, token, password } = parsed.data

  const valid = await consumePasswordResetToken(email, token)
  if (!valid) {
    throw new ApiError('This reset link is invalid or has expired', 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new ApiError('No account found for this email', 404)
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  await prisma.user.update({ where: { email }, data: { password: passwordHash } })

  return NextResponse.json({ data: null, message: 'Password reset successfully', code: 'success', status: 200 })
})
