import { NextRequest, NextResponse } from 'next/server'
import { constructStripeWebhookEvent } from '@/lib/stripe'
import { settleOrder } from '@/app/api/orders/settle'
import { settleCourseOrder } from '@/app/api/course-orders/settle'

/**
 * Real Stripe webhook receiver, shared by plain Order (Reserve/Borrow
 * card checkout) and course-order checkouts — branches on whichever
 * metadata key the session/payment_intent carries (see lib/stripe.ts's
 * createCheckoutSession, which sets exactly one of these per session).
 * Reads the raw request body via request.text() BEFORE any JSON parsing
 * — same raw-bytes-before-parsing requirement as the PayPack webhook,
 * since Stripe's signature only matches against exactly what it sent.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event
  try {
    event = constructStripeWebhookEvent(rawBody, signature)
  } catch {
    return NextResponse.json({ data: null, message: 'Invalid signature', code: 'error', status: 401 }, { status: 401 })
  }

  const settle = async (providerStatus: 'successful' | 'failed', metadata?: { orderId?: string; courseOrderId?: string }) => {
    if (metadata?.orderId) await settleOrder(metadata.orderId, { providerStatus })
    else if (metadata?.courseOrderId) await settleCourseOrder(metadata.courseOrderId, { providerStatus })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { orderId?: string; courseOrderId?: string } }
    await settle('successful', session.metadata)
  } else if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const obj = event.data.object as { metadata?: { orderId?: string; courseOrderId?: string } }
    await settle('failed', obj.metadata)
  }

  return NextResponse.json({ data: null, message: 'Webhook processed', code: 'success', status: 200 })
}
