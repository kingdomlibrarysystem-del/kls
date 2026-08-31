import { NextRequest, NextResponse } from 'next/server'
import { constructStripeWebhookEvent } from '@/lib/stripe'
import { settleCourseOrder } from '@/app/api/course-orders/settle'

/**
 * Real Stripe webhook receiver for course-order checkouts. Reads the raw
 * request body via request.text() BEFORE any JSON parsing — same
 * raw-bytes-before-parsing requirement as the PayPack webhook, since
 * Stripe's signature only matches against exactly what it sent.
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { courseOrderId?: string } }
    const courseOrderId = session.metadata?.courseOrderId
    if (courseOrderId) await settleCourseOrder(courseOrderId, { providerStatus: 'successful' })
  } else if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const obj = event.data.object as { metadata?: { courseOrderId?: string } }
    const courseOrderId = obj.metadata?.courseOrderId
    if (courseOrderId) await settleCourseOrder(courseOrderId, { providerStatus: 'failed' })
  }

  return NextResponse.json({ data: null, message: 'Webhook processed', code: 'success', status: 200 })
}
