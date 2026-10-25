import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'
import { requestCashin } from '@/lib/paypack'
import { createMultiItemCheckoutSession } from '@/lib/stripe'
import { appBaseUrl } from '@/lib/mailer'
import { notifyUser, notifyAllStaff } from '@/lib/notify'
import { orderPaidEmailHtml, orderFailedEmailHtml } from '@/lib/email-templates'
import { getShopSettings } from '@/lib/shop/data'
import { formatRwf, ORDER_STATUS, type OrderStatus } from '@/lib/shop/shared'
import { prepareMethod, isProviderMethod } from '@/lib/payments/flow'
import { startProviderPayment } from '@/lib/payments/attempts'
import { siteUrl } from '@/lib/payments/http'
import type { PaymentMethodCode } from '@/lib/payments/shared'

/**
 * Shop order lifecycle:
 *   place (reserve stock, start payment) -> PENDING_PAYMENT
 *   payment succeeds -> PAID -> staff: PROCESSING -> READY_FOR_PICKUP / OUT_FOR_DELIVERY -> COMPLETED
 *   payment fails / member cancels while unpaid / staff cancels -> FAILED / CANCELLED (stock given back)
 * Stock is reserved when the order is placed so two members can't buy the
 * last unit at the same time; it goes back whenever an order fails or is
 * cancelled (`stockReserved` makes that happen once).
 */

function newOrderNumber(): string {
  const d = new Date()
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SHP-${ymd}-${rand}`
}

export interface PlaceOrderInput {
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  deliveryMethod: 'PICKUP' | 'DELIVERY'
  deliveryAddress?: string
  notes?: string
  method: PaymentMethodCode
  /** Buy only these products from the cart (default: every available line). */
  productIds?: string[]
}

/**
 * Turns the member's cart into an order: re-reads prices and stock, reserves
 * stock atomically (fails with a clear message if something sold out),
 * removes those lines from the cart, then starts the payment. Returns the
 * order id and, for card payments, the Stripe page to open.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId: string; checkoutUrl?: string; message: string }> {
  // Method switched on + configured, phone suits it.
  await prepareMethod(input.method, input.buyerPhone)
  if (input.deliveryMethod === 'DELIVERY' && !input.deliveryAddress?.trim()) throw new ApiError('Enter the delivery address', 400)

  const cart = await prisma.productCartItem.findMany({
    where: { userId: input.userId, product: { is: {} }, ...(input.productIds?.length && { productId: { in: input.productIds } }) },
    include: { product: true },
  })
  const lines = cart.filter((c) => c.product.status === 'ACTIVE' && !c.product.deletedAt)
  if (lines.length === 0) throw new ApiError('Your cart has no products that can be bought', 400)
  for (const l of lines) {
    if (l.product.stockQty < l.quantity) {
      throw new ApiError(l.product.stockQty === 0 ? `“${l.product.title}” is sold out — remove it from your cart` : `Only ${l.product.stockQty} of “${l.product.title}” left — lower the quantity`, 409)
    }
  }

  const { deliveryFeeRwf: fee } = await getShopSettings()
  const deliveryFeeRwf = input.deliveryMethod === 'DELIVERY' ? fee : 0
  const subtotalRwf = lines.reduce((n, l) => n + l.product.priceRwf * l.quantity, 0)
  const totalRwf = subtotalRwf + deliveryFeeRwf
  if (totalRwf < 100) throw new ApiError('The order total must be at least 100 RWF', 400)

  const order = await prisma.$transaction(async (tx) => {
    // Reserve stock: each decrement only succeeds if enough is left right now.
    for (const l of lines) {
      const r = await tx.product.updateMany({ where: { id: l.productId, stockQty: { gte: l.quantity } }, data: { stockQty: { decrement: l.quantity } } })
      if (r.count === 0) throw new ApiError(`“${l.product.title}” just sold out — please update your cart`, 409)
    }
    const created = await tx.productOrder.create({
      data: {
        orderNumber: newOrderNumber(),
        userId: input.userId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        items: lines.map((l) => ({ productId: l.productId, title: l.product.title, image: l.product.images[0] ?? null, unitPriceRwf: l.product.priceRwf, quantity: l.quantity })),
        subtotalRwf,
        deliveryFeeRwf,
        totalRwf,
        deliveryMethod: input.deliveryMethod,
        deliveryAddress: input.deliveryMethod === 'DELIVERY' ? input.deliveryAddress!.trim() : null,
        notes: input.notes?.trim() || null,
        method: input.method,
        status: 'PENDING_PAYMENT',
        stockReserved: true,
      },
    })
    await tx.productCartItem.deleteMany({ where: { userId: input.userId, productId: { in: lines.map((l) => l.productId) } } })
    return created
  })

  return startPayment(order.id)
}

/** Starts (or restarts) the payment for an unpaid order. */
export async function startPayment(orderId: string): Promise<{ orderId: string; checkoutUrl?: string; message: string }> {
  const order = await prisma.productOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new ApiError('Order not found', 404)
  if (order.status !== 'PENDING_PAYMENT') throw new ApiError('This order is not waiting for payment', 409)

  try {
    if (isProviderMethod(order.method)) {
      const started = await startProviderPayment({
        method: order.method, targetKind: 'PRODUCT_ORDER', targetId: order.id, userId: order.userId, amountRwf: order.totalRwf,
        phone: order.buyerPhone, payer: { name: order.buyerName, email: order.buyerEmail },
        description: `Kingdom Library shop order ${order.orderNumber}`, returnUrl: siteUrl(`/member/shop/orders/${order.id}`),
      })
      return { orderId: order.id, checkoutUrl: started.redirectUrl, message: started.redirectUrl ? started.message : `A payment request of ${formatRwf(order.totalRwf)} was sent to ${order.buyerPhone}. Approve it on your phone to complete the order.` }
    }
    if (order.method === 'PAYPACK') {
      const cashin = await requestCashin({ amountRwf: order.totalRwf, phone: order.buyerPhone, idempotencyKey: `${order.id}-${Date.now()}` })
      await prisma.productOrder.update({ where: { id: order.id }, data: { paypackRef: cashin.ref, paypackStatus: cashin.status } })
      return { orderId: order.id, message: `A payment request of ${formatRwf(order.totalRwf)} was sent to ${order.buyerPhone}. Approve it on your phone to complete the order.` }
    }
    const base = appBaseUrl()
    const session = await createMultiItemCheckoutSession({
      metadataKey: 'productOrderId',
      orderId: order.id,
      items: [
        ...order.items.map((i) => ({ title: i.title, amountRwf: i.unitPriceRwf, quantity: i.quantity, imageUrl: i.image })),
        ...(order.deliveryFeeRwf > 0 ? [{ title: 'Delivery', amountRwf: order.deliveryFeeRwf, quantity: 1, imageUrl: null }] : []),
      ],
      successUrl: `${base}/member/shop/orders/${order.id}?paid=1`,
      cancelUrl: `${base}/member/shop/orders/${order.id}`,
    })
    await prisma.productOrder.update({ where: { id: order.id }, data: { stripeSessionId: session.id } })
    return { orderId: order.id, checkoutUrl: session.url, message: 'Opening the secure card payment page…' }
  } catch (error) {
    if (error instanceof ApiError) throw error
    // The order stays PENDING_PAYMENT (stock still reserved) so the member can retry.
    throw new ApiError(error instanceof Error ? `Could not start the payment: ${error.message}` : 'Could not start the payment', 502)
  }
}

/** Gives the order's units back to stock, exactly once. */
async function releaseStock(orderId: string): Promise<void> {
  const claim = await prisma.productOrder.updateMany({ where: { id: orderId, stockReserved: true }, data: { stockReserved: false } })
  if (claim.count === 0) return
  const order = await prisma.productOrder.findUnique({ where: { id: orderId }, select: { items: true } })
  for (const i of order?.items ?? []) {
    await prisma.product.updateMany({ where: { id: i.productId }, data: { stockQty: { increment: i.quantity } } })
  }
}

/**
 * Payment result from the PayPack/Stripe webhook or a status check.
 * Idempotent: only the first PENDING_PAYMENT -> PAID/FAILED change has effects.
 */
export async function settleProductOrder(orderId: string, input: { providerStatus: string; paypackStatus?: string; paypackProvider?: string }) {
  const order = await prisma.productOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Shop order not found')
  const isSuccessful = input.providerStatus === 'successful'
  const isFailed = input.providerStatus === 'failed'

  await prisma.productOrder.update({
    where: { id: orderId },
    data: { ...(input.paypackStatus && { paypackStatus: input.paypackStatus }), ...(input.paypackProvider && { paypackProvider: input.paypackProvider }) },
  })
  if (order.status !== 'PENDING_PAYMENT') return order

  const url = `${appBaseUrl()}/member/shop/orders/${order.id}`
  if (isSuccessful) {
    const flipped = await prisma.productOrder.updateMany({ where: { id: orderId, status: 'PENDING_PAYMENT' }, data: { status: 'PAID', paidAt: new Date() } })
    if (flipped.count === 0) return order
    for (const i of order.items) await prisma.product.updateMany({ where: { id: i.productId }, data: { soldCount: { increment: i.quantity } } })
    const summary = order.items.length === 1 ? order.items[0].title : `${order.items.length} products`
    await notifyUser({
      userId: order.userId, type: 'SYSTEM', category: 'order-payment-success',
      title: 'Order paid', message: `Order ${order.orderNumber} (${formatRwf(order.totalRwf)}) is paid — we are preparing it.`, href: `/member/shop/orders/${order.id}`,
      email: { subject: `Order ${order.orderNumber} confirmed`, html: orderPaidEmailHtml(order.buyerName, summary, order.totalRwf, url) },
    }).catch(() => {})
    await notifyAllStaff({ type: 'SYSTEM', category: 'shop-order-paid', title: 'New paid shop order', message: `${order.buyerName} paid order ${order.orderNumber} (${formatRwf(order.totalRwf)}).`, href: '/dashboard/beauty/shop/orders' }).catch(() => {})
  } else if (isFailed) {
    const flipped = await prisma.productOrder.updateMany({ where: { id: orderId, status: 'PENDING_PAYMENT' }, data: { status: 'FAILED' } })
    if (flipped.count === 0) return order
    await releaseStock(orderId)
    await notifyUser({
      userId: order.userId, type: 'SYSTEM', category: 'order-payment-failed',
      title: 'Payment failed', message: `The payment for order ${order.orderNumber} did not go through. Nothing was charged.`, href: `/member/shop/orders/${order.id}`,
      email: { subject: `Payment for order ${order.orderNumber} failed`, html: orderFailedEmailHtml(order.buyerName, `order ${order.orderNumber}`, url) },
    }).catch(() => {})
  }
  return prisma.productOrder.findUnique({ where: { id: orderId } })
}

/** Cancels an order and gives its stock back. Members may cancel only while unpaid; staff any time before completion. */
export async function cancelOrder(orderId: string, by: 'member' | 'staff', reason?: string) {
  const order = await prisma.productOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new ApiError('Order not found', 404)
  const allowed: OrderStatus[] = by === 'member' ? ['PENDING_PAYMENT'] : ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY']
  if (!allowed.includes(order.status as OrderStatus)) {
    throw new ApiError(by === 'member' ? 'A paid order can no longer be cancelled here — contact us for a refund' : `A ${ORDER_STATUS[order.status as OrderStatus].label.toLowerCase()} order cannot be cancelled`, 409)
  }
  await prisma.productOrder.update({ where: { id: orderId }, data: { status: 'CANCELLED', cancelledAt: new Date(), ...(reason && { staffNote: reason }) } })
  await releaseStock(orderId)
  if (by === 'staff') {
    await notifyUser({ userId: order.userId, type: 'SYSTEM', category: 'shop-order-update', title: 'Order cancelled', message: `Order ${order.orderNumber} was cancelled${reason ? `: ${reason}` : '.'}`, href: `/member/shop/orders/${order.id}` }).catch(() => {})
  }
}

/** Staff move a paid order along (PROCESSING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, COMPLETED), with an optional note to the member. */
export async function advanceOrder(orderId: string, status: OrderStatus, note?: string) {
  const order = await prisma.productOrder.findUnique({ where: { id: orderId } })
  if (!order) throw new ApiError('Order not found', 404)
  const fulfilment: OrderStatus[] = ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY']
  if (!fulfilment.includes(order.status as OrderStatus)) throw new ApiError('Only a paid, not yet completed order can be updated', 409)
  if (status === 'READY_FOR_PICKUP' && order.deliveryMethod !== 'PICKUP') throw new ApiError('This order is for delivery, not pickup', 400)
  if (status === 'OUT_FOR_DELIVERY' && order.deliveryMethod !== 'DELIVERY') throw new ApiError('This order is for pickup, not delivery', 400)
  const updated = await prisma.productOrder.update({ where: { id: orderId }, data: { status, ...(note !== undefined && { staffNote: note || null }) } })
  await notifyUser({
    userId: order.userId, type: 'SYSTEM', category: 'shop-order-update',
    title: `Order ${ORDER_STATUS[status].label.toLowerCase()}`, message: `Order ${order.orderNumber}: ${ORDER_STATUS[status].hint}${note ? ` ${note}` : ''}`,
    href: `/member/shop/orders/${order.id}`,
  }).catch(() => {})
  return updated
}
