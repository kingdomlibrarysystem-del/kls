import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import QRCode from 'qrcode'
import { authenticator } from 'otplib'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

const setupSchema = z.object({ userId: z.string().min(1, 'userId is required') })

/**
 * Generates a new TOTP secret and its QR provisioning URI for the
 * signed-in user, per APP_DOC Task 1.5. Not yet enabled — enabled only
 * flips true once /api/auth/2fa/verify confirms the user can actually
 * generate a real code with it (proving they scanned it into a real
 * authenticator app), matching how every real 2FA setup flow works.
 * Calling this again before verifying replaces the pending secret,
 * which is intentional (lets a user restart setup if the QR didn't scan).
 */
export const POST = withErrorHandling('/api/auth/2fa/setup', 'POST', async (request: NextRequest) => {
  const parsed = setupSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { userId } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const existing = await prisma.twoFactorSecret.findUnique({ where: { userId } })
  if (existing?.enabled) {
    throw new ApiError('Two-factor authentication is already enabled for this account', 409)
  }

  const secret = authenticator.generateSecret()
  const otpauthUri = authenticator.keyuri(user.email, 'Kingdom Library System', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauthUri)

  await prisma.twoFactorSecret.upsert({
    where: { userId },
    update: { secret, enabled: false, recoveryCodes: [] },
    create: { userId, secret, enabled: false, recoveryCodes: [] },
  })

  return NextResponse.json({
    data: { secret, qrDataUrl },
    message: 'Scan the QR code with your authenticator app, then confirm with a generated code',
    code: 'success',
    status: 200,
  })
})
