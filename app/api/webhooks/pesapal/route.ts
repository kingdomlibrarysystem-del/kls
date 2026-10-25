import { NextRequest, NextResponse } from 'next/server'
import { findAttempt, syncAttempt } from '@/lib/payments/attempts'

/**
 * PesaPal IPN (registered as POST; GET also accepted). Carries
 * OrderTrackingId + OrderMerchantReference; the outcome is read from
 * GetTransactionStatus (syncAttempt). PesaPal expects this exact echo back.
 */
async function handle(params: { OrderTrackingId?: string; OrderMerchantReference?: string; OrderNotificationType?: string }) {
  const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = params
  const attempt = (await findAttempt(OrderMerchantReference)) ?? (await findAttempt(OrderTrackingId))
  let status = 200
  if (attempt) await syncAttempt(attempt).catch((e) => { status = 500; console.error('[webhooks/pesapal]', e) })
  return NextResponse.json({ orderNotificationType: OrderNotificationType ?? 'IPNCHANGE', orderTrackingId: OrderTrackingId, orderMerchantReference: OrderMerchantReference, status })
}

export async function POST(request: NextRequest) {
  return handle((await request.json().catch(() => ({}))) ?? {})
}

export async function GET(request: NextRequest) {
  return handle(Object.fromEntries(new URL(request.url).searchParams))
}
