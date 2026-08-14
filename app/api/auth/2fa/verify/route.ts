import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { authenticator } from 'otplib'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

const verifySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  code: z.string().trim().min(6, 'Enter the 6-digit code from your authenticator app'),
})

/** Generates 6 recovery codes, formatted like KLS-XXXX-XXXX (matches the visual shape of the pre-migration mock's recovery codes). */
function generateRecoveryCodes(): string[] {
  return Array.from({ length: 6 }, () => {
    const bytes = randomBytes(4).toString('hex').toUpperCase()
    return `KLS-${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`
  })
}

/**
 * Confirms 2FA setup by checking a real generated code against the
 * pending secret from /api/auth/2fa/setup. Only on success does
 * `enabled` flip true and recovery codes get issued — this is the actual
 * proof the user has the secret loaded in a real authenticator app.
 */
export const POST = withErrorHandling('/api/auth/2fa/verify', 'POST', async (request: NextRequest) => {
  const parsed = verifySchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { userId, code } = parsed.data

  const record = await prisma.twoFactorSecret.findUnique({ where: { userId } })
  if (!record) throw new ApiError('No pending two-factor setup found — call /api/auth/2fa/setup first', 400)
  if (record.enabled) throw new ApiError('Two-factor authentication is already enabled for this account', 409)

  const valid = authenticator.check(code, record.secret)
  if (!valid) throw new ApiError('That code is incorrect or has expired — try the current code from your app', 400)

  const recoveryCodes = generateRecoveryCodes()
  await prisma.twoFactorSecret.update({ where: { userId }, data: { enabled: true, recoveryCodes } })

  return NextResponse.json({
    data: { recoveryCodes },
    message: 'Two-factor authentication enabled successfully',
    code: 'success',
    status: 200,
  })
})
