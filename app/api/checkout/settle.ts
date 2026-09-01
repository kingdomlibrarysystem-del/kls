import prisma from '@/prisma/client'
import { notifyUser } from '@/lib/notify'
import { orderPaidEmailHtml, orderFailedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'
import { createBorrowRecord } from '@/app/api/borrowings/create-borrow'
import { createReservationRecord } from '@/app/api/reservations/create-reservation'

interface SettleInput {
  paypackStatus?: string
  paypackProvider?: string
  /** Normalized 'successful' | 'failed' | anything else = still pending — same shared vocabulary as settleOrder. */
  providerStatus: string
}

/**
 * Combined-checkout settlement — sibling of settleOrder
 * (app/api/orders/settle.ts) for a Checkout paying for several cart
 * items at once. One PayPack cashin or one Stripe session backs the
 * whole Checkout, so settling it flips every linked Order to PAID/FAILED
 * together. Each Order's real Borrow (RENTAL)/Reservation (SALE) row is
 * normally already created back at checkout-start time (see POST
 * /api/checkout), so it's shown as pending in My Borrowings/My
 * Reservations before payment even completes — the loop here is a
 * safety net for the rare case one wasn't created then (e.g. the
 * duplicate-guard skipped it), not the primary creation path anymore.
 * Idempotent via each Order's own createdRecordId.
 */
export async function settleCheckout(checkoutId: string, input: SettleInput) {
  const checkout = await prisma.checkout.findUnique({ where: { id: checkoutId }, include: { orders: true } })
  if (!checkout) throw new Error('Checkout not found')

  const isSuccessful = input.providerStatus === 'successful'
  const isFailed = input.providerStatus === 'failed'

  const updated = await prisma.checkout.update({
    where: { id: checkoutId },
    data: {
      ...(input.paypackStatus && { paypackStatus: input.paypackStatus }),
      ...(input.paypackProvider && { paypackProvider: input.paypackProvider }),
      ...(isSuccessful && { status: 'PAID', paidAt: new Date() }),
      ...(isFailed && { status: 'FAILED' }),
    },
  })

  if (isSuccessful) {
    await prisma.order.updateMany({ where: { checkoutId }, data: { status: 'PAID', paidAt: new Date() } })

    for (const order of checkout.orders) {
      if (order.createdRecordId) continue
      const record = order.type === 'RENTAL'
        ? await createBorrowRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })
        : await createReservationRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })
      await prisma.order.update({ where: { id: order.id }, data: { createdRecordId: record.id } })
    }

    const itemCount = checkout.orders.length
    const summary = itemCount === 1 ? checkout.orders[0].resourceTitle : `${itemCount} items`
    const destinationUrl = `${appBaseUrl()}/member/orders`
    await notifyUser({
      userId: checkout.userId,
      type: checkout.orders.some((o) => o.type === 'RENTAL') ? 'BORROW' : 'RESERVATION',
      category: 'order-payment-success',
      title: 'Payment confirmed',
      message: `Your payment for ${summary} was successful.`,
      href: destinationUrl,
      email: { subject: 'Your order is confirmed', html: orderPaidEmailHtml(checkout.buyerName, summary, checkout.amountRwf, destinationUrl) },
    })
  } else if (isFailed && checkout.status !== 'FAILED') {
    await prisma.order.updateMany({ where: { checkoutId, status: 'PENDING' }, data: { status: 'FAILED' } })

    const itemCount = checkout.orders.length
    const summary = itemCount === 1 ? checkout.orders[0].resourceTitle : `${itemCount} items`
    const checkoutUrl = `${appBaseUrl()}/member/orders`
    await notifyUser({
      userId: checkout.userId,
      type: 'SYSTEM',
      category: 'order-payment-failed',
      title: 'Payment failed',
      message: `Your payment for ${summary} could not be completed.`,
      href: checkoutUrl,
      email: { subject: 'Your order payment failed', html: orderFailedEmailHtml(checkout.buyerName, summary, checkoutUrl) },
    })
  }

  return updated
}
