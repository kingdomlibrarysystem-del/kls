import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Real course-enrollment payment order API, parallel to /api/orders (see
 * CourseOrder's docstring in prisma/schema.prisma for why this is a
 * separate model rather than a polymorphic Order). Two real payment
 * rails: PayPack (immediately requests a real mobile-money cashin, same
 * as /api/orders) and Stripe (creates a real Checkout Session and
 * returns its URL for client-side redirect — settlement always happens
 * via the webhook or a status poll, never trusted from this response
 * alone).
 */
function serializeCourseOrder(o: {
  id: string
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  courseId: string
  courseTitle: string
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
    id: o.id,
    userId: o.userId,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    buyerPhone: o.buyerPhone,
    courseId: o.courseId,
    courseTitle: o.courseTitle,
    method: o.method.toLowerCase(),
    amount: o.amountRwf,
    status: o.status.toLowerCase(),
    paypackRef: o.paypackRef,
    paypackStatus: o.paypackStatus,
    stripeSessionId: o.stripeSessionId,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString().split('T')[0],
  }
}

const createCourseOrderSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  courseId: z.string().min(1, 'courseId is required'),
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
    prisma.courseOrder.count({ where }),
    prisma.courseOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: orders.map(serializeCourseOrder),
    message: 'Course orders fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

export const POST = withErrorHandling('/api/course-orders', 'POST', async (request: NextRequest) => {
  const parsed = createCourseOrderSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const course = await prisma.course.findUnique({ where: { id: body.courseId } })
  if (!course) throw new ApiError('Course not found', 404)
  if (!course.price || course.price <= 0) throw new ApiError('This course has no price set', 400)

  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(body.buyerPhone)) throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  const order = await prisma.courseOrder.create({
    data: {
      userId: body.userId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      courseId: body.courseId,
      courseTitle: course.title,
      method: body.method,
      amountRwf: course.price,
      status: 'PENDING',
    },
  })

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({ amountRwf: course.price, phone: body.buyerPhone, idempotencyKey: order.id })
      const updated = await prisma.courseOrder.update({ where: { id: order.id }, data: { paypackRef: cashin.ref, paypackStatus: cashin.status } })
      return NextResponse.json(
        { data: serializeCourseOrder(updated), message: 'Payment request sent — approve it on your phone to complete enrollment.', code: 'success', status: 201 },
        { status: 201 }
      )
    } catch (error) {
      await prisma.courseOrder.update({ where: { id: order.id }, data: { status: 'FAILED' } })
      throw new ApiError(error instanceof Error ? error.message : 'Failed to request payment', 502)
    }
  }

  try {
    const base = appBaseUrl()
    const session = await createCheckoutSession({
      courseOrderId: order.id,
      courseTitle: course.title,
      amountRwf: course.price,
      successUrl: `${base}/member/courses?checkout=success`,
      cancelUrl: `${base}/member/courses?checkout=cancelled`,
    })
    const updated = await prisma.courseOrder.update({ where: { id: order.id }, data: { stripeSessionId: session.id } })
    return NextResponse.json(
      { data: { ...serializeCourseOrder(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 201 },
      { status: 201 }
    )
  } catch (error) {
    await prisma.courseOrder.update({ where: { id: order.id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
