import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { findTransaction } from '@/lib/paypack'
import { retrieveCheckoutSession } from '@/lib/stripe'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'
import { settleCheckout } from '../settle'
import { serializeCheckout } from '../serialize'

/**
 * Status-refresh endpoint for a combined Checkout — same poll-fallback
 * shape as GET /api/orders/[id], but settles every linked Order together
 * via settleCheckout. Cart items were already removed when the Checkout
 * was created (see POST /api/checkout), not here — this route only ever
 * flips status.
 */
export const GET = withErrorHandling('/api/checkout/[id]', 'GET', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const checkout = await prisma.checkout.findUnique({ where: { id }, include: { orders: true } })
  if (!checkout) throw new ApiError('Checkout not found', 404)

  const auth = await requireOwnerOrStaff(checkout.userId)
  if (auth.response) return auth.response

  if (checkout.status !== 'PENDING') {
    return NextResponse.json({ data: serializeCheckout(checkout), message: 'Checkout fetched', code: 'success', status: 200 })
  }

  if (checkout.paypackRef) {
    try {
      const remote = await findTransaction(checkout.paypackRef)
      if (remote.status !== checkout.paypackStatus) {
        await settleCheckout(checkout.id, { paypackStatus: remote.status, providerStatus: remote.status })
        const fresh = await prisma.checkout.findUniqueOrThrow({ where: { id: checkout.id }, include: { orders: true } })
        return NextResponse.json({ data: serializeCheckout(fresh), message: 'Checkout status refreshed', code: 'success', status: 200 })
      }
    } catch {
      // PayPack lookup failed — fall through and return the checkout's last known state rather than blocking the poll.
    }
  } else if (checkout.stripeSessionId) {
    try {
      const session = await retrieveCheckoutSession(checkout.stripeSessionId)
      const providerStatus = session.payment_status === 'paid' ? 'successful' : session.status === 'expired' ? 'failed' : 'pending'
      if (providerStatus !== 'pending') {
        await settleCheckout(checkout.id, { providerStatus })
        const fresh = await prisma.checkout.findUniqueOrThrow({ where: { id: checkout.id }, include: { orders: true } })
        return NextResponse.json({ data: serializeCheckout(fresh), message: 'Checkout status refreshed', code: 'success', status: 200 })
      }
    } catch {
      // Stripe lookup failed — fall through and return the checkout's last known state rather than blocking the poll.
    }
  }

  return NextResponse.json({ data: serializeCheckout(checkout), message: 'Checkout fetched', code: 'success', status: 200 })
})
