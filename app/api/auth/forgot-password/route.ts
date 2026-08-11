import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { sendMail, appBaseUrl } from '@/lib/mailer'
import { createPasswordResetToken } from '@/lib/verification-tokens'
import { passwordResetEmailHtml } from '@/lib/email-templates'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
})

/**
 * Always returns success regardless of whether the email matches a real
 * account — the frontend's own "if an account exists..." copy already
 * assumes this, and returning a distinct response for unknown emails
 * would let an attacker enumerate registered addresses. Rate-limited per
 * IP since this endpoint sends real email and could otherwise be used
 * to spam an arbitrary address.
 */
export const POST = withErrorHandling('/api/auth/forgot-password', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'auth:forgot-password', { max: 5, windowMs: 15 * 60 * 1000 })

  const parsed = forgotPasswordSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { email } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    try {
      const token = await createPasswordResetToken(email)
      const resetUrl = `${appBaseUrl()}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
      await sendMail(email, 'Reset your Kingdom Library System password', passwordResetEmailHtml(user.firstName ?? 'there', resetUrl))
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
    }
  }

  return NextResponse.json({ data: null, message: 'If an account exists with that email, a reset link has been sent', code: 'success', status: 200 })
})
