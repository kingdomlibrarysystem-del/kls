import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { findTransaction } from '@/lib/paypack'
import { retrieveCheckoutSession } from '@/lib/stripe'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { settleCourseOrder } from '../settle'

/**
 * Status-refresh endpoint, parallel to /api/orders/[id] — a member polls
 * this while waiting on either rail's async confirmation (a PayPack phone
 * prompt, or a Stripe redirect that hasn't triggered its webhook yet).
 * Re-checks the real provider directly rather than only trusting this
 * row's last-known state.
 */
export const GET = withErrorHandling('/api/course-orders/[id]', 'GET', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const order = await prisma.courseOrder.findUnique({ where: { id } })
  if (!order) throw new ApiError('Course order not found', 404)

  const auth = await requireOwnerOrStaff(order.userId)
  if (auth.response) return auth.response

  if (order.status !== 'PENDING') {
    return NextResponse.json({ data: serialize(order), message: 'Course order fetched', code: 'success', status: 200 })
  }

  if (order.method === 'PAYPACK' && order.paypackRef) {
    try {
      const remote = await findTransaction(order.paypackRef)
      if (remote.status !== order.paypackStatus) {
        const updated = await settleCourseOrder(order.id, { paypackStatus: remote.status, providerStatus: remote.status })
        return NextResponse.json({ data: serialize(updated), message: 'Course order status refreshed', code: 'success', status: 200 })
      }
    } catch {
      // PayPack lookup failed — fall through and return last known state rather than blocking the poll.
    }
  } else if (order.method === 'STRIPE' && order.stripeSessionId) {
    try {
      const session = await retrieveCheckoutSession(order.stripeSessionId)
      const providerStatus = session.payment_status === 'paid' ? 'successful' : session.status === 'expired' ? 'failed' : 'pending'
      if (providerStatus !== 'pending') {
        const updated = await settleCourseOrder(order.id, { providerStatus })
        return NextResponse.json({ data: serialize(updated), message: 'Course order status refreshed', code: 'success', status: 200 })
      }
    } catch {
      // Stripe lookup failed — fall through and return last known state rather than blocking the poll.
    }
  }

  return NextResponse.json({ data: serialize(order), message: 'Course order fetched', code: 'success', status: 200 })
})

function serialize(o: {
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
