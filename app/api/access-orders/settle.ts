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
 * webhook, and a GET status-poll route — whichever one learns an
 * AccessOrder settled PAID also creates the real Borrow or Reservation
 * row, so "pay to borrow/reserve" resolves the same way regardless of
 * which rail confirmed it first. Idempotent via createdRecordId: once
 * set, a re-settle (e.g. both the webhook and a poll racing) skips
 * re-creating the row — a duplicate createBorrowRecord/
 * createReservationRecord call would otherwise 409 on the same guard
 * those functions already apply, but checking createdRecordId first
 * avoids even attempting it.
 */
export async function settleAccessOrder(orderId: string, input: SettleInput) {
  const order = await prisma.accessOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('AccessOrder not found')

  const isSuccessful = input.providerStatus === 'successful'
  const isFailed = input.providerStatus === 'failed'

  const updated = await prisma.accessOrder.update({
    where: { id: orderId },
    data: {
      ...(input.paypackStatus && { paypackStatus: input.paypackStatus }),
      ...(input.paypackProvider && { paypackProvider: input.paypackProvider }),
      ...(isSuccessful && { status: 'PAID', paidAt: new Date() }),
      ...(isFailed && { status: 'FAILED' }),
    },
  })

  const verb = order.kind === 'BORROW' ? 'borrow' : 'reservation'

  if (isSuccessful && !order.createdRecordId) {
    const record = order.kind === 'BORROW'
      ? await createBorrowRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })
      : await createReservationRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })

    await prisma.accessOrder.update({ where: { id: orderId }, data: { createdRecordId: record.id } })

    const destinationUrl = `${appBaseUrl()}/member/${order.kind === 'BORROW' ? 'borrowings' : 'reservations'}/${record.id}`
    await notifyUser({
      userId: order.userId,
      type: order.kind === 'BORROW' ? 'BORROW' : 'RESERVATION',
      category: 'access-payment-success',
      title: 'Payment confirmed',
      message: `Your payment for "${order.resourceTitle}" was successful — your ${verb} has been placed.`,
      href: destinationUrl,
      email: { subject: 'Your payment is confirmed', html: orderPaidEmailHtml(order.buyerName, order.resourceTitle, order.amountRwf, destinationUrl) },
    })
  } else if (isFailed && order.status !== 'FAILED') {
    const libraryUrl = `${appBaseUrl()}/member/library`
    await notifyUser({
      userId: order.userId,
      type: 'SYSTEM',
      category: 'access-payment-failed',
      title: 'Payment failed',
      message: `Your payment for "${order.resourceTitle}" could not be completed.`,
      href: libraryUrl,
      email: { subject: 'Your payment failed', html: orderFailedEmailHtml(order.buyerName, order.resourceTitle, libraryUrl) },
    })
  }

  return updated
}
