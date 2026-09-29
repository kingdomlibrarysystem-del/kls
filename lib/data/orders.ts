import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeOrder(o: {
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

/**
 * One order in the GET /api/orders/[id] shape, plus its owner id. This is the
 * stored state only — the route additionally re-polls PayPack/Stripe for a
 * PENDING order; detail views trigger that one refresh client-side when needed.
 */
export async function getOrderDetail(id: string) {
  if (!isObjectId(id)) return null
  const order = await prisma.order.findUnique({ where: { id } })
  return order ? { ownerId: order.userId, order: serializeOrder(order) } : null
}
