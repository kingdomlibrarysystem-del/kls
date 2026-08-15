import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { findTransaction } from '@/lib/paypack'

/**
 * Status-refresh endpoint — a member polls this after requesting a
 * cashin (e.g. while waiting on their phone) as a fallback for when
 * PayPack's webhook hasn't arrived yet. Re-checks PayPack directly via
 * the real /transactions/find/{ref} endpoint rather than only trusting
 * whatever this Order row currently says.
 */
export const GET = withErrorHandling('/api/orders/[id]', 'GET', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw new ApiError('Order not found', 404)

  if (order.status === 'PENDING' && order.paypackRef) {
    try {
      const remote = await findTransaction(order.paypackRef)
      if (remote.status !== order.paypackStatus) {
        const isSuccessful = remote.status === 'successful'
        const isFailed = remote.status === 'failed'
        const updated = await prisma.order.update({
          where: { id },
          data: {
            paypackStatus: remote.status,
            ...(isSuccessful && { status: 'PAID', paidAt: new Date() }),
            ...(isFailed && { status: 'FAILED' }),
          },
        })
        return NextResponse.json({ data: serialize(updated), message: 'Order status refreshed', code: 'success', status: 200 })
      }
    } catch {
      // PayPack lookup failed — fall through and return the order's last known state rather than blocking the poll.
    }
  }

  return NextResponse.json({ data: serialize(order), message: 'Order fetched', code: 'success', status: 200 })
})

function serialize(o: {
  id: string
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  resourceId: string
  resourceTitle: string
  resourceFormat: string
  type: string
  amountRwf: number
  status: string
  paypackRef: string | null
  paypackStatus: string | null
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
    type: o.type,
    amount: o.amountRwf,
    status: o.status.toLowerCase(),
    paypackRef: o.paypackRef,
    paypackStatus: o.paypackStatus,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString().split('T')[0],
  }
}
