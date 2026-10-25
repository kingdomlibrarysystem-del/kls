import { NextRequest, NextResponse } from 'next/server'
import { findAttempt, syncAttempt } from '@/lib/payments/attempts'

/**
 * IntouchPay callback. The body only tells us WHICH transaction changed —
 * the outcome is re-read from InTouch's gettransactionstatus (syncAttempt)
 * before anything is settled, so a forged callback can't mark an order paid.
 * InTouch expects { message: "success", success: true, request_id }.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { jsonpayload?: { requesttransactionid?: string; transactionid?: string } } | null
  const p = body?.jsonpayload ?? (body as { requesttransactionid?: string; transactionid?: string } | null)
  const ref = p?.requesttransactionid
  if (!ref) return NextResponse.json({ message: 'Missing requesttransactionid', success: false }, { status: 400 })

  const attempt = await findAttempt(ref)
  if (attempt) {
    if (!attempt.providerRef && p?.transactionid) {
      const { default: prisma } = await import('@/prisma/client')
      await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { providerRef: p.transactionid } })
      attempt.providerRef = p.transactionid
    }
    await syncAttempt(attempt).catch((e) => console.error('[webhooks/intouch]', e))
  }
  return NextResponse.json({ message: 'success', success: true, request_id: ref })
}
