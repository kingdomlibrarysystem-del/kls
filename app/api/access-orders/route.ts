import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Real payment order API for a paid Borrow/Reservation request, parallel
 * to /api/course-orders (see AccessOrder's docstring in
 * prisma/schema.prisma for why this is a separate model rather than a
 * polymorphic Order). Two real payment rails: PayPack (immediately
 * requests a real mobile-money cashin) and Stripe (creates a real
 * Checkout Session and returns its URL for client-side redirect) —
 * settlement always happens via a webhook or a status poll, never
 * trusted from this response alone. The Borrow/Reservation row itself is
 * only created once settlement confirms payment (see settle.ts).
 */
function serializeAccessOrder(o: {
  id: string
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  resourceId: string
  resourceTitle: string
  kind: string
  method: string
  amountRwf: number
  status: string
  createdRecordId: string | null
  paypackRef: string | null
  paypackStatus: string | null
  stripeSessionId: string | null
  paidAt: Date | null
  createdAt: Date
}) {
  return {
    id: o.id,
    userId: o.userId,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    buyerPhone: o.buyerPhone,
    resourceId: o.resourceId,
    resourceTitle: o.resourceTitle,
    kind: o.kind.toLowerCase(),
    method: o.method.toLowerCase(),
    amount: o.amountRwf,
    status: o.status.toLowerCase(),
    createdRecordId: o.createdRecordId,
    paypackRef: o.paypackRef,
    paypackStatus: o.paypackStatus,
    stripeSessionId: o.stripeSessionId,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString().split('T')[0],
  }
}

const createAccessOrderSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  kind: z.enum(['BORROW', 'RESERVATION']),
  buyerName: z.string().trim().min(1, 'buyerName is required'),
  buyerEmail: z.string().trim().email('buyerEmail must be a valid email'),
  buyerPhone: z.string().trim().min(1, 'buyerPhone is required'),
  method: z.enum(['PAYPACK', 'STRIPE']),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')

  const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
  if (auth.response) return auth.response

  const where = {
    ...(userId && { userId }),
    ...(status && status !== 'all' && { status: status.toUpperCase() as 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' }),
  }

  const [totalItems, orders] = await Promise.all([
    prisma.accessOrder.count({ where }),
    prisma.accessOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: orders.map(serializeAccessOrder),
    message: 'Access orders fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

export const POST = withErrorHandling('/api/access-orders', 'POST', async (request: NextRequest) => {
  const parsed = createAccessOrderSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const resource = await prisma.resource.findUnique({ where: { id: body.resourceId } })
  if (!resource) throw new ApiError('Resource not found', 404)

  const settings = await prisma.settings.findFirst()
  const fee = body.kind === 'BORROW' ? settings?.borrowingFee ?? 0 : settings?.reservationFee ?? 0
  if (!fee || fee <= 0) throw new ApiError(`No ${body.kind === 'BORROW' ? 'borrowing' : 'reservation'} fee is currently set`, 400)

  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(body.buyerPhone)) throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  const order = await prisma.accessOrder.create({
    data: {
      userId: body.userId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      resourceId: body.resourceId,
      resourceTitle: resource.title,
      kind: body.kind,
      method: body.method,
      amountRwf: fee,
      status: 'PENDING',
    },
  })

  const verb = body.kind === 'BORROW' ? 'borrow' : 'reserve'

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({ amountRwf: fee, phone: body.buyerPhone, idempotencyKey: order.id })
      const updated = await prisma.accessOrder.update({ where: { id: order.id }, data: { paypackRef: cashin.ref, paypackStatus: cashin.status } })
      return NextResponse.json(
        { data: serializeAccessOrder(updated), message: `Payment request sent — approve it on your phone to ${verb} this resource.`, code: 'success', status: 201 },
        { status: 201 }
      )
    } catch (error) {
      await prisma.accessOrder.update({ where: { id: order.id }, data: { status: 'FAILED' } })
      throw new ApiError(error instanceof Error ? error.message : 'Failed to request payment', 502)
    }
  }

  try {
    const base = appBaseUrl()
    const session = await createCheckoutSession({
      metadataKey: 'accessOrderId',
      orderId: order.id,
      title: resource.title,
      amountRwf: fee,
      successUrl: `${base}/member/library?checkout=success`,
      cancelUrl: `${base}/member/library?checkout=cancelled`,
    })
    const updated = await prisma.accessOrder.update({ where: { id: order.id }, data: { stripeSessionId: session.id } })
    return NextResponse.json(
      { data: { ...serializeAccessOrder(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 201 },
      { status: 201 }
    )
  } catch (error) {
    await prisma.accessOrder.update({ where: { id: order.id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
