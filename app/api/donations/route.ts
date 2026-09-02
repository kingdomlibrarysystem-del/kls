import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Real donation payment API, mirrors /api/orders' exact single-item
 * PayPack/Stripe kickoff shape (no cart involved — a donation is
 * always one charge). Validates exactly one of campaignId set (a
 * general/campaign donation) — POST /api/donations/sponsor is the
 * separate resourceId-targeted flow, kept as its own route since it's
 * a distinct promised endpoint per the module's own in-page hint.
 */
function serializeDonation(d: {
  id: string
  userId: string
  donorName: string
  donorEmail: string
  donorPhone: string
  campaignId: string | null
  resourceId: string | null
  message: string | null
  isAnonymous: boolean
  method: string
  amountRwf: number
  status: string
  paypackRef: string | null
  paypackStatus: string | null
  stripeSessionId: string | null
  paidAt: Date | null
  createdAt: Date
}) {
  return {
    id: d.id,
    userId: d.userId,
    donorName: d.donorName,
    donorEmail: d.donorEmail,
    donorPhone: d.donorPhone,
    campaignId: d.campaignId,
    resourceId: d.resourceId,
    message: d.message,
    isAnonymous: d.isAnonymous,
    method: d.method,
    amountRwf: d.amountRwf,
    status: d.status.toLowerCase(),
    paypackRef: d.paypackRef,
    paypackStatus: d.paypackStatus,
    stripeSessionId: d.stripeSessionId,
    paidAt: d.paidAt ? d.paidAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const status = searchParams.get('status')

  const where = {
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' }),
  }

  const [totalItems, donations] = await Promise.all([
    prisma.donation.count({ where }),
    prisma.donation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: donations.map(serializeDonation),
    message: 'Donations fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const createDonationSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  campaignId: z.string().min(1, 'campaignId is required'),
  donorName: z.string().trim().min(1, 'donorName is required'),
  donorEmail: z.string().trim().email('donorEmail must be a valid email'),
  donorPhone: z.string().trim().optional().default(''),
  amountRwf: z.number().positive('amountRwf must be greater than 0'),
  message: z.string().trim().optional(),
  isAnonymous: z.boolean().optional().default(false),
  method: z.enum(['PAYPACK', 'STRIPE']),
})

export const POST = withErrorHandling('/api/donations', 'POST', async (request: NextRequest) => {
  const parsed = createDonationSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(body.donorPhone)) throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  const campaign = await prisma.donationCampaign.findUnique({ where: { id: body.campaignId } })
  if (!campaign) throw new ApiError('Campaign not found', 404)
  if (campaign.status !== 'ACTIVE') throw new ApiError('This campaign is no longer accepting donations', 409)

  const donation = await prisma.donation.create({
    data: {
      userId: body.userId,
      campaignId: body.campaignId,
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
      return NextResponse.json({ data: serializeDonation(updated), message: 'Payment request sent — approve it on your phone to complete your donation.', code: 'success', status: 201 }, { status: 201 })
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
      title: `Donation — ${campaign.title}`,
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
