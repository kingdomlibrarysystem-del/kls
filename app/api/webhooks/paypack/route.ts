import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { verifyPaypackSignature, type PaypackWebhookPayload } from '@/lib/paypack'
import { settleOrder } from '@/app/api/orders/settle'
import { settleCheckout } from '@/app/api/checkout/settle'
import { settleCourseOrder } from '@/app/api/course-orders/settle'
import { settleDonation } from '@/app/api/donations/settle'

/**
 * Real PayPack webhook receiver — fires on the `transaction:processed`
 * event once a cashin actually settles (successful or failed). Reads the
 * raw request body via request.text() BEFORE any JSON parsing, since
 * the signature (x-paypack-signature: HMAC-SHA256 of the raw bytes,
 * base64) only matches against exactly what PayPack sent — re-
 * serializing a parsed object first would silently break verification
 * for a genuine webhook.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-paypack-signature')

  if (!verifyPaypackSignature(rawBody, signature)) {
    return NextResponse.json({ data: null, message: 'Invalid signature', code: 'error', status: 401 }, { status: 401 })
  }

  let payload: PaypackWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ data: null, message: 'Invalid JSON body', code: 'error', status: 400 }, { status: 400 })
  }

  if (payload.kind !== 'transaction:processed') {
    return NextResponse.json({ data: null, message: 'Event ignored', code: 'success', status: 200 })
  }

  const { ref, status } = payload.data
  // findFirst, not findUnique — paypackRef is no longer a @unique field in
  // schema.prisma (a real sparse unique index enforces it at the DB level
  // instead; see Order.paypackRef's docstring), so Prisma's generated
  // WhereUniqueInput no longer accepts it alone.
  const checkout = await prisma.checkout.findFirst({ where: { paypackRef: ref } })
  if (checkout) {
    await settleCheckout(checkout.id, { paypackStatus: status, paypackProvider: payload.data.provider, providerStatus: status })
    return NextResponse.json({ data: null, message: 'Webhook processed', code: 'success', status: 200 })
  }

  const order = await prisma.order.findFirst({ where: { paypackRef: ref } })
  if (order) {
    await settleOrder(order.id, { paypackStatus: status, paypackProvider: payload.data.provider, providerStatus: status })
    return NextResponse.json({ data: null, message: 'Webhook processed', code: 'success', status: 200 })
  }

  const courseOrder = await prisma.courseOrder.findFirst({ where: { paypackRef: ref } })
  if (courseOrder) {
    await settleCourseOrder(courseOrder.id, { paypackStatus: status, paypackProvider: payload.data.provider, providerStatus: status })
    return NextResponse.json({ data: null, message: 'Webhook processed', code: 'success', status: 200 })
  }

  const donation = await prisma.donation.findFirst({ where: { paypackRef: ref } })
  if (donation) {
    await settleDonation(donation.id, { paypackStatus: status, paypackProvider: payload.data.provider, providerStatus: status })
    return NextResponse.json({ data: null, message: 'Webhook processed', code: 'success', status: 200 })
  }

  return NextResponse.json({ data: null, message: 'No matching order for this transaction', code: 'success', status: 200 })
}
