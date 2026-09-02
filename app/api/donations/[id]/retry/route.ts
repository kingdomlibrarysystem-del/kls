import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'

/** Retries a FAILED/PENDING donation's payment under the same row, mirrors /api/checkout/[id]/retry's exact shape. */
function serializeDonation(d: { id: string; status: string; paypackRef: string | null; paypackStatus: string | null; stripeSessionId: string | null }) {
  return { id: d.id, status: d.status.toLowerCase(), paypackRef: d.paypackRef, paypackStatus: d.paypackStatus, stripeSessionId: d.stripeSessionId }
}

const retrySchema = z.object({
  donorPhone: z.string().trim().optional(),
  method: z.enum(['PAYPACK', 'STRIPE']),
})

export const POST = withErrorHandling('/api/donations/[id]/retry', 'POST', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = retrySchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const donation = await prisma.donation.findUnique({ where: { id } })
  if (!donation) throw new ApiError('Donation not found', 404)
  if (donation.status === 'PAID') throw new ApiError('This donation has already been paid', 400)

  const auth = await requireOwnerOrStaff(donation.userId)
  if (auth.response) return auth.response

  const donorPhone = body.donorPhone?.trim() || donation.donorPhone
  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(donorPhone)) throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  await prisma.donation.update({
    where: { id },
    data: { status: 'PENDING', method: body.method, donorPhone, paypackRef: null, paypackStatus: null, stripeSessionId: null },
  })

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({ amountRwf: donation.amountRwf, phone: donorPhone, idempotencyKey: `${donation.id}-r${Date.now()}` })
      const updated = await prisma.donation.update({ where: { id }, data: { paypackRef: cashin.ref, paypackStatus: cashin.status } })
      return NextResponse.json({ data: serializeDonation(updated), message: 'Payment request sent — approve it on your phone to complete your donation.', code: 'success', status: 200 })
    } catch (error) {
      await prisma.donation.update({ where: { id }, data: { status: 'FAILED' } })
      throw new ApiError(error instanceof Error ? error.message : 'Failed to request payment', 502)
    }
  }

  try {
    const base = appBaseUrl()
    const session = await createCheckoutSession({
      metadataKey: 'donationId',
      orderId: donation.id,
      title: 'Donation',
      amountRwf: donation.amountRwf,
      successUrl: `${base}/dashboard/donations/history?checkout=success`,
      cancelUrl: `${base}/dashboard/donations/history?checkout=cancelled`,
    })
    const updated = await prisma.donation.update({ where: { id }, data: { stripeSessionId: session.id } })
    return NextResponse.json({ data: { ...serializeDonation(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 200 })
  } catch (error) {
    await prisma.donation.update({ where: { id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
