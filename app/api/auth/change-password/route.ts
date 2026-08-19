import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireAuth } from '@/lib/auth/require-role'

const changePasswordSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

const BCRYPT_ROUNDS = 10

/** Changes the signed-in user's own password — requires the real current password to verify, unlike /api/auth/reset-password (which is for a forgotten password, so uses an emailed token instead). */
export const POST = withErrorHandling('/api/auth/change-password', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'auth:change-password', { max: 10, windowMs: 15 * 60 * 1000 })

  const parsed = changePasswordSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { userId, currentPassword, newPassword } = parsed.data

  // Strictly self-only, not owner-or-staff: even an admin should not be
  // able to change another account's password through this "I know my
  // current password" self-service path — that would reintroduce the
  // exact privilege-escalation shape this check exists to close.
  const auth = await requireAuth()
  if (auth.response) return auth.response
  if (auth.session.userId !== userId) {
    return NextResponse.json({ data: null, message: 'You can only change your own password.', code: 'error', status: 403 }, { status: 403 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.password) {
    throw new ApiError('Account not found or has no password set', 400)
  }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) {
    throw new ApiError('Current password is incorrect', 401)
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await prisma.user.update({ where: { id: userId }, data: { password: passwordHash } })

  return NextResponse.json({ data: null, message: 'Password changed successfully', code: 'success', status: 200 })
})
