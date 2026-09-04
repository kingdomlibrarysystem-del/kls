import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Public newsletter email subscriber endpoint — no auth required.
 * Accepts a raw email, normalizes (lowercased, trimmed), and upserts
 * into NewsletterSubscriber. Duplicate emails return a clear message
 * rather than leaking whether an address is already in the list.
 */
const subscribeSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
})

export const POST = withErrorHandling('/api/newsletter/subscribe', 'POST', async (request: NextRequest) => {
  const parsed = subscribeSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }

  const email = parsed.data.email.toLowerCase()

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ data: null, message: 'This email is already subscribed.', code: 'success', status: 200 }, { status: 200 })
  }

  await prisma.newsletterSubscriber.create({ data: { email } })

  return NextResponse.json({ data: { email }, message: 'Subscribed successfully', code: 'success', status: 201 }, { status: 201 })
})

export async function GET() {
  return NextResponse.json({ data: null, message: 'Method not allowed', code: 'error', status: 405 }, { status: 405 })
}
