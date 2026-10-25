import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { hasPermission } from '@/lib/auth/permissions'
import { findTransaction } from '@/lib/paypack'
import { retrieveCheckoutSession } from '@/lib/stripe'
import prisma from '@/prisma/client'
import { getOrder } from '@/lib/shop/data'
import { advanceOrder, cancelOrder, settleProductOrder, startPayment } from '@/lib/shop/orders'
import { orderActionSchema } from '@/lib/shop/schemas'
import { SHOP_PERMISSION } from '@/lib/shop/shared'

type Ctx = { params: Promise<{ id: string }> }

async function access(id: string) {
  const auth = await requireAuth()
  if (auth.response) throw new ApiError('You must be signed in to do this.', 401)
  const order = await getOrder(id)
  if (!order) throw new ApiError('Order not found', 404)
  const isStaff = await hasPermission(auth.session, SHOP_PERMISSION)
  if (order.userId !== auth.session.userId && !isStaff) throw new ApiError('Order not found', 404)
  return { order, isStaff, isOwner: order.userId === auth.session.userId }
}

/** GET /api/shop/orders/[id] — the order's owner, or shop staff. */
export const GET = withErrorHandling('/api/shop/orders/[id]', 'GET', async (_request: NextRequest, { params }: Ctx) => {
  const { id } = await params
  const a = await access(id)
  return NextResponse.json({ data: a.order, message: 'Order fetched', code: 'success', status: 200 })
})

/**
 * PATCH /api/shop/orders/[id] { action }:
 *  - check: ask PayPack / Stripe for the payment result now (owner or staff);
 *  - retry: send the payment request again (owner, unpaid order);
 *  - cancel: owner while unpaid; staff before completion (stock is given back);
 *  - advance { status, note }: staff — Preparing / Ready for pickup / Out for delivery / Completed.
 */
export const PATCH = withErrorHandling('/api/shop/orders/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const { id } = await params
  const a = await access(id)
  const parsed = orderActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  if (body.action === 'check') {
    if (a.order.status === 'PENDING_PAYMENT') {
      const row = await prisma.productOrder.findUnique({ where: { id }, select: { paypackRef: true, stripeSessionId: true } })
      if (row?.paypackRef) {
        const t = await findTransaction(row.paypackRef).catch(() => null)
        if (t) await settleProductOrder(id, { providerStatus: t.status, paypackStatus: t.status })
      } else if (row?.stripeSessionId) {
        const s = await retrieveCheckoutSession(row.stripeSessionId).catch(() => null)
        if (s?.payment_status === 'paid') await settleProductOrder(id, { providerStatus: 'successful' })
        else if (s?.status === 'expired') await settleProductOrder(id, { providerStatus: 'failed' })
      }
    }
    const order = await getOrder(id)
    return NextResponse.json({ data: order, message: order?.status === 'PENDING_PAYMENT' ? 'Still waiting for the payment' : 'Order updated', code: 'success', status: 200 })
  }

  if (body.action === 'retry') {
    if (!a.isOwner) throw new ApiError('Only the buyer can retry the payment', 403)
    const result = await startPayment(id)
    return NextResponse.json({ data: { ...(await getOrder(id)), checkoutUrl: result.checkoutUrl }, message: result.message, code: 'success', status: 200 })
  }

  if (body.action === 'cancel') {
    await cancelOrder(id, a.isStaff ? 'staff' : 'member', body.reason)
    return NextResponse.json({ data: await getOrder(id), message: 'Order cancelled', code: 'success', status: 200 })
  }

  // advance
  if (!a.isStaff) throw new ApiError('Only shop staff can update an order', 403)
  await advanceOrder(id, body.status, body.note)
  return NextResponse.json({ data: await getOrder(id), message: 'Order updated', code: 'success', status: 200 })
})
