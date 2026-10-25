import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { findAttempt, syncAttempt } from '@/lib/payments/attempts'

/**
 * UrubutoPay callbacks, authenticated with `Authorization: Bearer
 * URUBUTOPAY_WEBHOOK_TOKEN`. PAYMENT callbacks settle through syncAttempt
 * (which still re-checks the status with UrubutoPay). RECURRING, INVOICE and
 * BULK_DISBURSEMENT_* callbacks are acknowledged and logged — no flow uses
 * them yet.
 */
function authorized(request: NextRequest): boolean {
  const expected = process.env.URUBUTOPAY_WEBHOOK_TOKEN?.trim()
  const got = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!expected || !got) return false
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ status: 401, message: 'Unauthorized', timestamp: stamp() }, { status: 401 })
  const body = await request.json().catch(() => null) as { callback_type?: string; transaction_id?: string; internal_transaction_id?: string } | null
  if (!body) return NextResponse.json({ status: 400, message: 'Invalid body', timestamp: stamp() }, { status: 400 })

  if (body.callback_type === 'PAYMENT' || !body.callback_type) {
    const attempt = (await findAttempt(body.transaction_id)) ?? (await findAttempt(body.internal_transaction_id))
    if (attempt) await syncAttempt(attempt).catch((e) => console.error('[webhooks/urubutopay]', e))
  } else {
    console.info('[webhooks/urubutopay] callback', body.callback_type)
  }
  return NextResponse.json({ status: 200, message: 'Callback received', timestamp: stamp() })
}
