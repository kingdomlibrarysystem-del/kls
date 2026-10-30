import { NextRequest, NextResponse } from 'next/server'
import { findAttempt, syncAttempt } from '@/lib/payments/attempts'

/**
 * MTN MoMo RequestToPay callback (X-Callback-Url). MTN does not sign it, so
 * the body is only used to find the attempt; the status comes from MTN's
 * GET /requesttopay/{referenceId} (syncAttempt).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { referenceId?: string; externalId?: string } | null
  const attempt = (await findAttempt(body?.externalId)) ?? (await findAttempt(body?.referenceId))
  if (attempt) await syncAttempt(attempt).catch((e) => console.error('[webhooks/mtn-momo]', e))
  return NextResponse.json({ message: 'Webhook received' })
}

/** MTN sends PUT on some environments. */
export const PUT = POST
