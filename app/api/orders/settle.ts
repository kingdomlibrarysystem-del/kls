import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { orderPaidEmailHtml, orderFailedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'
import { createBorrowRecord } from '@/app/api/borrowings/create-borrow'
import { createReservationRecord } from '@/app/api/reservations/create-reservation'

interface SettleInput {
  paypackStatus?: string
  paypackProvider?: string
  /** Normalized 'successful' | 'failed' | anything else = still pending — shared vocabulary between PayPack's own status strings and the poll route's own Stripe-status normalization, so this function doesn't need to know which rail produced it. */
  providerStatus: string
}

/**
 * Single settlement path shared by the PayPack webhook, the Stripe
 * webhook, and a GET status-poll route — whichever one learns an Order
 * settled PAID also creates the real Borrow (RENTAL) or Reservation
 * (SALE) row, so "pay to reserve/borrow" resolves the same way
 * regardless of which rail confirmed it first. Idempotent via
 * createdRecordId: once set, a re-settle (e.g. the webhook and a poll
 * racing) skips re-creating the row.
 */
export async function settleOrder(orderId: string, input: SettleInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Order not found')

  const isSuccessful = input.providerStatus === 'successful'
  const isFailed = input.providerStatus === 'failed'

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(input.paypackStatus && { paypackStatus: input.paypackStatus }),
      ...(input.paypackProvider && { paypackProvider: input.paypackProvider }),
      ...(isSuccessful && { status: 'PAID', paidAt: new Date() }),
      ...(isFailed && { status: 'FAILED' }),
    },
  })

  const verb = order.type === 'RENTAL' ? 'borrow' : 'reservation'

  if (isSuccessful && !order.createdRecordId) {
    const record = order.type === 'RENTAL'
      ? await createBorrowRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })
      : await createReservationRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })

    await prisma.order.update({ where: { id: orderId }, data: { createdRecordId: record.id } })

    const destinationUrl = `${appBaseUrl()}/member/${order.type === 'RENTAL' ? 'borrowings' : 'reservations'}/${record.id}`
    await notifyUser({
      userId: order.userId,
      type: order.type === 'RENTAL' ? 'BORROW' : 'RESERVATION',
      category: 'order-payment-success',
      title: 'Payment confirmed',
      message: `Your payment for "${order.resourceTitle}" was successful — your ${verb} has been placed.`,
      href: destinationUrl,
      email: { subject: 'Your order is confirmed', html: orderPaidEmailHtml(order.buyerName, order.resourceTitle, order.amountRwf, destinationUrl) },
    })
  } else if (isFailed && order.status !== 'FAILED') {
    const orderUrl = `${appBaseUrl()}/member/orders/${order.id}`
    await notifyUser({
      userId: order.userId,
      type: 'SYSTEM',
      category: 'order-payment-failed',
      title: 'Payment failed',
      message: `Your payment for "${order.resourceTitle}" could not be completed.`,
      href: orderUrl,
      email: { subject: 'Your order payment failed', html: orderFailedEmailHtml(order.buyerName, order.resourceTitle, orderUrl) },
    })
  }

  return updated
}
