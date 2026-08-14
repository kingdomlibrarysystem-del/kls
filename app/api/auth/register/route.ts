import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/prisma/client'
import { sendMail, appBaseUrl } from '@/lib/mailer'
import { createEmailVerificationToken } from '@/lib/verification-tokens'
import { verificationEmailHtml } from '@/lib/email-templates'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { checkRateLimit } from '@/lib/rate-limit'

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
})

const BCRYPT_ROUNDS = 10

/**
 * Real member self-registration, replacing
 * contexts/auth-context.tsx's register() (which only fabricated a User
 * object in localStorage — no database write, no email). Creates a
 * real User row with a bcrypt-hashed password, assigned to a "Member"
 * Role (created on first use, since the Role collection currently has
 * no seeded rows at all — confirmed via a direct query before writing
 * this route).
 *
 * Sends a real verification email via Nodemailer. Registration still
 * succeeds even if the email fails to send (e.g. missing/invalid SMTP
 * credentials) — an unverified account is a recoverable state, but a
 * transient mail-provider failure should never block account creation.
 * Rate-limited per IP to slow down automated mass-account creation.
 */
export const POST = withErrorHandling('/api/auth/register', 'POST', async (request: NextRequest) => {
  checkRateLimit(request, 'auth:register', { max: 5, windowMs: 15 * 60 * 1000 })

  const parsed = registerSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const { fullName, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new ApiError('An account with this email already exists', 409)
  }

  const memberRole = await prisma.role.upsert({
    where: { name: 'Member' },
    update: {},
    create: { name: 'Member', description: 'Default role for self-registered members', permissions: [] },
  })

  const [firstName, ...rest] = fullName.split(/\s+/)
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      name: fullName,
      firstName: firstName || fullName,
      lastName: rest.join(' '),
      email,
      password: passwordHash,
      roleId: memberRole.id,
    },
  })

  try {
    const token = await createEmailVerificationToken(email)
    const verifyUrl = `${appBaseUrl()}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
    await sendMail(email, 'Verify your Kingdom Library System account', verificationEmailHtml(user.firstName ?? fullName, verifyUrl))
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError)
  }

  return NextResponse.json({
    data: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
    message: 'Account created successfully',
    code: 'success',
    status: 201,
  }, { status: 201 })
})
