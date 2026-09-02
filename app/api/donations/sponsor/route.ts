import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'

/** The hinted POST /api/donations/sponsor — same payment kickoff as POST /api/donations, but with resourceId instead of campaignId. */
function serializeDonation(d: { id: string; userId: string; donorName: string; donorPhone: string; resourceId: string | null; method: string; amountRwf: number; status: string; paypackRef: string | null; paypackStatus: string | null; stripeSessionId: string | null }) {
  return {
    id: d.id,
    userId: d.userId,
    donorName: d.donorName,
    resourceId: d.resourceId,
    method: d.method,
    amountRwf: d.amountRwf,
    status: d.status.toLowerCase(),
    paypackRef: d.paypackRef,
    paypackStatus: d.paypackStatus,
    stripeSessionId: d.stripeSessionId,
  }
}

const sponsorSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  donorName: z.string().trim().min(1, 'donorName is required'),
  donorEmail: z.string().trim().email('donorEmail must be a valid email'),
  donorPhone: z.string().trim().optional().default(''),
  amountRwf: z.number().positive('amountRwf must be greater than 0'),
  message: z.string().trim().optional(),
  isAnonymous: z.boolean().optional().default(false),
  method: z.enum(['PAYPACK', 'STRIPE']),
})

export const POST = withErrorHandling('/api/donations/sponsor', 'POST', async (request: NextRequest) => {
  const parsed = sponsorSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(body.donorPhone)) throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  const resource = await prisma.resource.findUnique({ where: { id: body.resourceId } })
  if (!resource) throw new ApiError('Resource not found', 404)

  const donation = await prisma.donation.create({
    data: {
      userId: body.userId,
      resourceId: body.resourceId,
      donorName: body.donorName,
      donorEmail: body.donorEmail,
      donorPhone: body.donorPhone,
      message: body.message,
      isAnonymous: body.isAnonymous,
      method: body.method,
      amountRwf: body.amountRwf,
      status: 'PENDING',
    },
  })

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({ amountRwf: body.amountRwf, phone: body.donorPhone, idempotencyKey: donation.id })
      const updated = await prisma.donation.update({ where: { id: donation.id }, data: { paypackRef: cashin.ref, paypackStatus: cashin.status } })
      return NextResponse.json({ data: serializeDonation(updated), message: 'Payment request sent — approve it on your phone to complete your sponsorship.', code: 'success', status: 201 }, { status: 201 })
    } catch (error) {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: 'FAILED' } })
      throw new ApiError(error instanceof Error ? error.message : 'Failed to request payment', 502)
    }
  }

  try {
    const base = appBaseUrl()
    const session = await createCheckoutSession({
      metadataKey: 'donationId',
      orderId: donation.id,
      title: `Sponsorship — ${resource.title}`,
      amountRwf: body.amountRwf,
      successUrl: `${base}/dashboard/donations/history?checkout=success`,
      cancelUrl: `${base}/dashboard/donations/history?checkout=cancelled`,
    })
    const updated = await prisma.donation.update({ where: { id: donation.id }, data: { stripeSessionId: session.id } })
    return NextResponse.json({ data: { ...serializeDonation(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 201 }, { status: 201 })
  } catch (error) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
