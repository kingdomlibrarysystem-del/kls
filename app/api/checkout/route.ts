import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createMultiItemCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'
import { createBorrowRecord } from '@/app/api/borrowings/create-borrow'
import { createReservationRecord } from '@/app/api/reservations/create-reservation'
import { serializeCheckout } from './serialize'

/** RENTAL (Borrow) charges resource.borrowPrice; SALE (Reserve) charges resource.price — the two products have independent pricing. */
function unitPriceFor(item: { type: string; resource: { price: number; borrowPrice: number } }): number {
  return item.type === 'RENTAL' ? item.resource.borrowPrice : item.resource.price
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
  if (auth.response) return auth.response

  const checkouts = await prisma.checkout.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { orders: true },
    take: 200,
  })

  return NextResponse.json({ data: checkouts.map(serializeCheckout), message: 'Checkouts fetched successfully', code: 'success', status: 200 })
}

/**
 * Real combined checkout — pays for every requested cart item (mixed
 * SALE/RENTAL) in one charge, replacing the old one-Order-per-button
 * flow. Creates one Order per cartItemId (same per-resource shape the
 * rest of the app already reads: settlement, admin Sales views,
 * entitlement checks) plus one Checkout row tying them together, then
 * starts exactly one PayPack cashin for the summed total or one Stripe
 * Checkout Session with one line item per Order. Every item's real
 * Borrow (RENTAL)/Reservation (SALE) row is also created right away, in
 * its own natural PENDING status — same as the pre-existing staff-facing
 * create paths — rather than waiting for payment to settle, so a member
 * sees their pending borrow/reservation in My Borrowings/My Reservations
 * immediately (payment confirmation only flips Order/Checkout.status;
 * see settleCheckout — it never had to move Borrow/Reservation out of
 * PENDING either, since that already required separate staff approval).
 * Cart rows are removed here too, once the order is placed — matching
 * "add to cart, then it moves to My Orders" rather than only clearing on
 * confirmed payment, which left items sitting in the cart the entire
 * time a payment was pending/failed with no way to tell they'd already
 * been ordered.
 */
const createCheckoutSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  cartItemIds: z.array(z.string().min(1)).min(1, 'Select at least one item to pay for'),
  buyerName: z.string().trim().min(1, 'buyerName is required'),
  buyerEmail: z.string().trim().email('buyerEmail must be a valid email'),
  // Only required for PAYPACK (a real mobile-money number to prompt) —
  // a Card/Stripe checkout has no phone field on the form at all, so
  // enforcing it unconditionally here blocked every Card payment with
  // "buyerPhone is required" even though the client never collected one.
  buyerPhone: z.string().trim().optional().default(''),
  method: z.enum(['PAYPACK', 'STRIPE']),
})

export const POST = withErrorHandling('/api/checkout', 'POST', async (request: NextRequest) => {
  const parsed = createCheckoutSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(body.buyerPhone)) {
      throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
    }
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { id: { in: body.cartItemIds }, cart: { userId: body.userId } },
    include: { resource: true },
  })
  if (cartItems.length !== body.cartItemIds.length) throw new ApiError('One or more selected cart items were not found', 404)
  // SALE (Reserve) always requires a real price; RENTAL (Borrow) may be
  // free (borrowPrice defaults to 0), so only SALE items are checked.
  for (const item of cartItems) {
    if (item.type === 'SALE' && (!item.resource.price || item.resource.price <= 0)) {
      throw new ApiError(`"${item.resource.title}" has no price set`, 400)
    }
  }

  const amountRwf = cartItems.reduce((sum, item) => sum + unitPriceFor(item) * item.quantity, 0)
  // A free-borrow-only selection has nothing to charge — the checkout
  // flow exists to collect a real payment, so route a zero-total
  // selection back to the caller rather than let PayPack's own 100 RWF
  // minimum (lib/paypack.ts) or an empty Stripe session fail unclearly.
  if (amountRwf <= 0) throw new ApiError('These items are free — nothing to pay. Confirm them directly instead of checking out.', 400)

  const checkout = await prisma.checkout.create({
    data: {
      userId: body.userId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      method: body.method,
      amountRwf,
      status: 'PENDING',
    },
  })

  await prisma.order.createMany({
    data: cartItems.map((item) => ({
      userId: body.userId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      resourceId: item.resourceId,
      resourceTitle: item.resource.title,
      resourceFormat: item.resource.mediaType,
      resourceCover: item.resource.coverImages[0] ?? null,
      type: item.type,
      amountRwf: unitPriceFor(item) * item.quantity,
      status: 'PENDING' as const,
      checkoutId: checkout.id,
    })),
  })

  const orders = await prisma.order.findMany({ where: { checkoutId: checkout.id } })
  for (const order of orders) {
    try {
      const record = order.type === 'RENTAL'
        ? await createBorrowRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })
        : await createReservationRecord({ userId: order.userId, resourceId: order.resourceId, memberName: order.buyerName, memberEmail: order.buyerEmail })
      await prisma.order.update({ where: { id: order.id }, data: { createdRecordId: record.id } })
    } catch {
      // Member already has a pending/active Borrow or Reservation for this
      // resource from an earlier attempt (createBorrowRecord/
      // createReservationRecord's own duplicate guard) — this Order still
      // represents a real charge, it just doesn't get its own new record;
      // settleCheckout's createdRecordId check will leave it alone too.
    }
  }

  await prisma.cartItem.deleteMany({ where: { id: { in: body.cartItemIds } } })

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({ amountRwf, phone: body.buyerPhone, idempotencyKey: checkout.id })
      const updated = await prisma.checkout.update({
        where: { id: checkout.id },
        data: { paypackRef: cashin.ref, paypackStatus: cashin.status },
        include: { orders: true },
      })
      return NextResponse.json(
        { data: serializeCheckout(updated), message: 'Payment request sent — approve it on your phone to complete the purchase.', code: 'success', status: 201 },
        { status: 201 }
      )
    } catch (error) {
      await prisma.checkout.update({ where: { id: checkout.id }, data: { status: 'FAILED' } })
      await prisma.order.updateMany({ where: { checkoutId: checkout.id }, data: { status: 'FAILED' } })
      throw new ApiError(error instanceof Error ? error.message : 'Failed to request payment', 502)
    }
  }

  try {
    const base = appBaseUrl()
    const session = await createMultiItemCheckoutSession({
      metadataKey: 'checkoutId',
      orderId: checkout.id,
      items: cartItems.map((item) => ({
        title: item.resource.title,
        amountRwf: unitPriceFor(item),
        quantity: item.quantity,
        imageUrl: item.resource.coverImages[0] ?? null,
      })),
      successUrl: `${base}/member/orders?checkout=success`,
      cancelUrl: `${base}/member/checkout?checkout=cancelled`,
    })
    const updated = await prisma.checkout.update({
      where: { id: checkout.id },
      data: { stripeSessionId: session.id },
      include: { orders: true },
    })
    return NextResponse.json(
      { data: { ...serializeCheckout(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 201 },
      { status: 201 }
    )
  } catch (error) {
    await prisma.checkout.update({ where: { id: checkout.id }, data: { status: 'FAILED' } })
    await prisma.order.updateMany({ where: { checkoutId: checkout.id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
