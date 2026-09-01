import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Real Reserve (SALE)/Borrow (RENTAL) payment order API, replacing
 * app/dashboard/library/sales/_components/sales-data.ts's fully mocked
 * Transaction[]. Two real payment rails, same shape as
 * /api/course-orders: PayPack (immediately requests a real mobile-money
 * cashin — moves real RWF the instant this succeeds, no sandbox exists,
 * see lib/paypack.ts) and Stripe (creates a real Checkout Session and
 * returns its URL for client-side redirect). The order starts PENDING;
 * only the matching webhook (or a manual status refresh) flips it to
 * PAID, which is what actually creates the real Borrow/Reservation row
 * (see settle.ts) — never trusted from this response alone.
 */
function serializeOrder(o: {
  id: string
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  resourceId: string
  resourceTitle: string
  resourceFormat: string
  resourceCover: string | null
  type: string
  amountRwf: number
  status: string
  checkoutId: string | null
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
    resourceFormat: o.resourceFormat,
    resourceCover: o.resourceCover,
    type: o.type,
    amount: o.amountRwf,
    status: o.status.toLowerCase(),
    checkoutId: o.checkoutId,
    paypackRef: o.paypackRef,
    paypackStatus: o.paypackStatus,
    stripeSessionId: o.stripeSessionId,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString().split('T')[0],
  }
}

const createOrderSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  buyerName: z.string().trim().min(1, 'buyerName is required'),
  buyerEmail: z.string().trim().email('buyerEmail must be a valid email'),
  buyerPhone: z.string().trim().min(1, 'buyerPhone is required'),
  type: z.enum(['SALE', 'RENTAL']),
  method: z.enum(['PAYPACK', 'STRIPE']).default('PAYPACK'),
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
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: orders.map(serializeOrder),
    message: 'Orders fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

export const POST = withErrorHandling('/api/orders', 'POST', async (request: NextRequest) => {
  const parsed = createOrderSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(body.buyerPhone)) {
      throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
    }
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  const resource = await prisma.resource.findUnique({ where: { id: body.resourceId } })
  if (!resource) throw new ApiError('Resource not found', 404)
  if (!resource.price || resource.price <= 0) throw new ApiError('This resource has no price set', 400)

  const order = await prisma.order.create({
    data: {
      userId: body.userId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      resourceId: body.resourceId,
      resourceTitle: resource.title,
      resourceFormat: resource.mediaType,
      resourceCover: resource.coverImages[0] ?? null,
      type: body.type,
      amountRwf: resource.price,
      status: 'PENDING',
    },
  })

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({
        amountRwf: resource.price,
        phone: body.buyerPhone,
        idempotencyKey: order.id,
      })

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { paypackRef: cashin.ref, paypackStatus: cashin.status },
      })

      return NextResponse.json(
        { data: serializeOrder(updated), message: 'Payment request sent — approve it on your phone to complete the purchase.', code: 'success', status: 201 },
        { status: 201 }
      )
    } catch (error) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } })
      throw new ApiError(error instanceof Error ? error.message : 'Failed to request payment', 502)
    }
  }

  try {
    const base = appBaseUrl()
    const session = await createCheckoutSession({
      metadataKey: 'orderId',
      orderId: order.id,
      title: resource.title,
      amountRwf: resource.price,
      successUrl: `${base}/member/cart?checkout=success`,
      cancelUrl: `${base}/member/cart?checkout=cancelled`,
    })
    const updated = await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } })
    return NextResponse.json(
      { data: { ...serializeOrder(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 201 },
      { status: 201 }
    )
  } catch (error) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
