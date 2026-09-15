import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { sendMail, appBaseUrl } from '@/lib/mailer'

const schema = z.object({ email: z.string().email('Invalid email address') })

export const POST = withErrorHandling('/api/newsletter/subscribe', 'POST', async (request: NextRequest) => {
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid email address', 400)

  const { email } = parsed.data

  // Check existence first so we can distinguish new vs already-subscribed
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email }, select: { id: true } })

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email, active: true },
  })

  if (existing) {
    return NextResponse.json({ data: null, message: 'You are already subscribed! We will keep you updated.', code: 'already_subscribed', status: 200 })
  }

  // Welcome email — fire and forget
  const base = appBaseUrl()
  sendMail(email, 'Welcome to Kingdom Library Newsletter', `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#2c2416">Welcome to Kingdom Library!</h2>
      <p>You're now subscribed to our newsletter. You'll receive updates about new books, courses, lessons, and published articles.</p>
      <p style="margin-top:24px"><a href="${base}/library" style="background:#8a6d3b;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none">Browse the Library</a></p>
      <p style="margin-top:24px;font-size:12px;color:#888">To unsubscribe, reply to this email or contact us.</p>
    </div>
  `).catch(() => {})

  return NextResponse.json({ data: null, message: 'Subscribed successfully', code: 'success', status: 201 }, { status: 201 })
})
