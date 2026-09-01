import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requestCashin, isValidPaypackPhone } from '@/lib/paypack'
import { createMultiItemCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { appBaseUrl } from '@/lib/mailer'
import { serializeCheckout } from '../../serialize'

/**
 * Retries a FAILED or PENDING (e.g. abandoned) Checkout — starts a fresh
 * PayPack cashin or Stripe Checkout Session under the SAME Checkout/Order
 * rows rather than creating new ones, so My Orders keeps showing one
 * entry per attempted purchase across retries. Resets every linked Order
 * back to PENDING first.
 */
const retrySchema = z.object({
  buyerPhone: z.string().trim().optional(),
  method: z.enum(['PAYPACK', 'STRIPE']),
})

export const POST = withErrorHandling('/api/checkout/[id]/retry', 'POST', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = retrySchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const checkout = await prisma.checkout.findUnique({ where: { id }, include: { orders: true } })
  if (!checkout) throw new ApiError('Checkout not found', 404)
  if (checkout.status === 'PAID') throw new ApiError('This order has already been paid', 400)
  if (checkout.status === 'CANCELLED') throw new ApiError('This order was cancelled', 400)

  const auth = await requireOwnerOrStaff(checkout.userId)
  if (auth.response) return auth.response

  const buyerPhone = body.buyerPhone?.trim() || checkout.buyerPhone
  if (body.method === 'PAYPACK') {
    if (!isValidPaypackPhone(buyerPhone)) {
      throw new ApiError('Enter a valid Rwandan mobile money number (MTN or Airtel).', 400)
    }
  } else if (!isStripeConfigured()) {
    throw new ApiError('Card payment is not configured for this environment yet.', 503)
  }

  await prisma.order.updateMany({ where: { checkoutId: checkout.id }, data: { status: 'PENDING' } })
  await prisma.checkout.update({
    where: { id: checkout.id },
    data: { status: 'PENDING', method: body.method, buyerPhone, retryCount: { increment: 1 }, paypackRef: null, paypackStatus: null, stripeSessionId: null },
  })

  if (body.method === 'PAYPACK') {
    try {
      const cashin = await requestCashin({ amountRwf: checkout.amountRwf, phone: buyerPhone, idempotencyKey: `${checkout.id}-r${checkout.retryCount + 1}` })
      const updated = await prisma.checkout.update({
        where: { id: checkout.id },
        data: { paypackRef: cashin.ref, paypackStatus: cashin.status },
        include: { orders: true },
      })
      return NextResponse.json(
        { data: serializeCheckout(updated), message: 'Payment request sent — approve it on your phone to complete the purchase.', code: 'success', status: 200 },
        { status: 200 }
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
      items: checkout.orders.map((o) => ({ title: o.resourceTitle, amountRwf: o.amountRwf, quantity: 1, imageUrl: o.resourceCover })),
      successUrl: `${base}/member/orders?checkout=success`,
      cancelUrl: `${base}/member/orders?checkout=cancelled`,
    })
    const updated = await prisma.checkout.update({
      where: { id: checkout.id },
      data: { stripeSessionId: session.id },
      include: { orders: true },
    })
    return NextResponse.json(
      { data: { ...serializeCheckout(updated), checkoutUrl: session.url }, message: 'Redirecting to checkout…', code: 'success', status: 200 },
      { status: 200 }
    )
  } catch (error) {
    await prisma.checkout.update({ where: { id: checkout.id }, data: { status: 'FAILED' } })
    await prisma.order.updateMany({ where: { checkoutId: checkout.id }, data: { status: 'FAILED' } })
    throw new ApiError(error instanceof Error ? error.message : 'Failed to start checkout', 502)
  }
})
