import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

const disableSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  currentPassword: z.string().min(1, 'Current password is required'),
})

/** Disabling 2FA requires the current password (not just being signed in) — same defense-in-depth reasoning as /api/auth/change-password, since a stolen/left-open session shouldn't be enough to turn off a security control. */
export const POST = withErrorHandling('/api/auth/2fa/disable', 'POST', async (request: NextRequest) => {
  const parsed = disableSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { userId, currentPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.password) throw new ApiError('Account not found or has no password set', 400)

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw new ApiError('Current password is incorrect', 401)

  const existing = await prisma.twoFactorSecret.findUnique({ where: { userId } })
  if (!existing?.enabled) throw new ApiError('Two-factor authentication is not enabled for this account', 400)

  await prisma.twoFactorSecret.delete({ where: { userId } })

  return NextResponse.json({ data: null, message: 'Two-factor authentication disabled successfully', code: 'success', status: 200 })
})
