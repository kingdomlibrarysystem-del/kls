import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { serializeCheckout } from '../../serialize'

/**
 * Cancels a PENDING or FAILED Checkout and its linked Orders — a member
 * giving up on a stuck/declined payment rather than retrying it. A PAID
 * checkout can't be cancelled here. Each Order's real Borrow/Reservation
 * row (created up front at checkout time — see POST /api/checkout) is
 * cancelled too, so it stops appearing as pending in My Borrowings/My
 * Reservations once the member has explicitly abandoned the purchase.
 */
export const POST = withErrorHandling('/api/checkout/[id]/cancel', 'POST', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const checkout = await prisma.checkout.findUnique({ where: { id }, include: { orders: true } })
  if (!checkout) throw new ApiError('Checkout not found', 404)
  if (checkout.status === 'PAID') throw new ApiError('This order has already been paid and cannot be cancelled', 400)

  const auth = await requireOwnerOrStaff(checkout.userId)
  if (auth.response) return auth.response

  for (const order of checkout.orders) {
    if (!order.createdRecordId) continue
    if (order.type === 'RENTAL') {
      await prisma.borrow.updateMany({ where: { id: order.createdRecordId, status: 'PENDING' }, data: { status: 'REJECTED' } })
    } else {
      await prisma.reservation.updateMany({ where: { id: order.createdRecordId, status: 'PENDING' }, data: { status: 'CANCELLED' } })
    }
  }

  await prisma.order.updateMany({ where: { checkoutId: checkout.id }, data: { status: 'CANCELLED' } })
  const updated = await prisma.checkout.update({ where: { id: checkout.id }, data: { status: 'CANCELLED' }, include: { orders: true } })

  return NextResponse.json({ data: serializeCheckout(updated), message: 'Order cancelled', code: 'success', status: 200 })
})
