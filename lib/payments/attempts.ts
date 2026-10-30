import { randomBytes } from 'node:crypto'
import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'
import { settleCheckout } from '@/app/api/checkout/settle'
import { settleOrder } from '@/app/api/orders/settle'
import { settleCourseOrder } from '@/app/api/course-orders/settle'
import { settleDonation } from '@/app/api/donations/settle'
import { settleProductOrder } from '@/lib/shop/orders'
import { PROVIDERS, type ProviderMethod } from './methods'
import { PaymentProviderError, type AttemptState } from './types'
import type { PaymentAttempt, PaymentTargetKind } from '@prisma/client'

/**
 * Provider-neutral payment attempts for InTouch, MTN MoMo, PesaPal and
 * UrubutoPay. A flow (library checkout, single order, course, donation, shop
 * order) calls startProviderPayment; webhooks and status polls call
 * syncAttempt, which ALWAYS re-checks with the provider's status API before
 * settling — a callback body alone is never trusted (the Food Bundles
 * InTouch/MTN handlers trusted it; this does not). Settling goes through each
 * flow's existing settle function, guarded so it runs once.
 */

/** 20 chars, [A-Z0-9] — safe for every provider's transaction-id field. */
function newReference(): string {
  return `KL${Date.now().toString(36).toUpperCase()}${randomBytes(5).toString('hex').toUpperCase()}`.slice(0, 20)
}

export interface StartInput {
  method: ProviderMethod
  targetKind: PaymentTargetKind
  targetId: string
  userId?: string | null
  amountRwf: number
  phone?: string
  payer: { name: string; email: string }
  description: string
  /** Where PesaPal returns the payer (our page that shows the result). */
  returnUrl: string
}

export interface StartResult {
  attemptId: string
  reference: string
  status: AttemptState
  /** Present for hosted checkouts — the client navigates here. */
  redirectUrl?: string
  message: string
}

/** Validates the phone for the chosen provider before anything is created. Throws a 400 with a payer-friendly message. */
export function assertPhoneFor(method: ProviderMethod, phone: string | undefined) {
  const p = PROVIDERS[method]
  if (p.kind !== 'mobile') return
  const err = p.phoneError?.(phone ?? '')
  if (err) throw new ApiError(err, 400)
}

export async function startProviderPayment(input: StartInput): Promise<StartResult> {
  const provider = PROVIDERS[input.method]
  if (!provider.isConfigured()) throw new ApiError('This payment method is not set up on the server yet.', 503)
  assertPhoneFor(input.method, input.phone)
  if (!(input.amountRwf > 0)) throw new ApiError('Nothing to pay.', 400)

  const reference = newReference()
  const attempt = await prisma.paymentAttempt.create({
    data: {
      provider: input.method, targetKind: input.targetKind, targetId: input.targetId, userId: input.userId ?? null,
      reference, amountRwf: input.amountRwf, phone: input.phone || null,
    },
  })

  try {
    const r = await provider.collect({
      reference, amountRwf: input.amountRwf, phone: input.phone,
      payer: { id: input.userId ?? undefined, ...input.payer }, description: input.description, returnUrl: input.returnUrl,
    })
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { providerRef: r.providerRef ?? null, redirectUrl: r.redirectUrl ?? null, providerStatus: r.providerStatus ?? null, ...(r.status === 'FAILED' && { status: 'FAILED', failureReason: r.message }) },
    })
    if (r.status === 'FAILED') throw new ApiError(r.message, 502)
    return { attemptId: attempt.id, reference, status: r.status, redirectUrl: r.redirectUrl, message: r.message }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'The payment provider could not be reached.'
    await prisma.paymentAttempt.updateMany({ where: { id: attempt.id, status: 'PENDING' }, data: { status: 'FAILED', failureReason: msg } })
    if (e instanceof ApiError) throw e
    throw new ApiError(msg, e instanceof PaymentProviderError ? e.status : 502)
  }
}

/** Runs the flow's own settle function. 'successful' / 'failed' is the shared vocabulary all of them accept. */
export async function settleTarget(kind: PaymentTargetKind, id: string, outcome: 'successful' | 'failed') {
  const input = { providerStatus: outcome }
  switch (kind) {
    case 'CHECKOUT': return settleCheckout(id, input)
    case 'ORDER': return settleOrder(id, input)
    case 'COURSE_ORDER': return settleCourseOrder(id, input)
    case 'DONATION': return settleDonation(id, input)
    case 'PRODUCT_ORDER': return settleProductOrder(id, input)
  }
}

/**
 * Asks the provider for the real status of a pending attempt and, once final,
 * marks it and settles its target. Safe to call from webhooks and polls at
 * the same time: only the call that flips PENDING → final settles.
 */
export async function syncAttempt(attempt: PaymentAttempt): Promise<AttemptState> {
  if (attempt.status !== 'PENDING') return attempt.status
  const provider = PROVIDERS[attempt.provider as ProviderMethod]
  if (!provider) return attempt.status

  let result
  try {
    result = await provider.checkStatus({ reference: attempt.reference, providerRef: attempt.providerRef })
  } catch (e) {
    console.error(`[payments] ${attempt.provider} status check failed for ${attempt.reference}:`, e instanceof Error ? e.message : e)
    return 'PENDING'
  }

  if (result.status === 'PENDING') {
    if (result.providerStatus !== attempt.providerStatus) {
      await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { providerStatus: result.providerStatus } }).catch(() => {})
    }
    return 'PENDING'
  }

  const flipped = await prisma.paymentAttempt.updateMany({
    where: { id: attempt.id, status: 'PENDING' },
    data: { status: result.status, providerStatus: result.providerStatus, failureReason: result.reason ?? null, settledAt: new Date() },
  })
  if (flipped.count === 1) {
    await settleTarget(attempt.targetKind, attempt.targetId, result.status === 'SUCCESSFUL' ? 'successful' : 'failed')
  }
  return result.status
}

/** For a flow's poll endpoint: syncs the newest pending attempt of a target (if any) and returns its state. */
export async function syncTarget(kind: PaymentTargetKind, targetId: string): Promise<AttemptState | null> {
  const attempt = await prisma.paymentAttempt.findFirst({ where: { targetKind: kind, targetId }, orderBy: { createdAt: 'desc' } })
  if (!attempt) return null
  return syncAttempt(attempt)
}

/** Webhook lookup: by our reference first, then by the provider's own id. */
export async function findAttempt(ref: string | undefined | null): Promise<PaymentAttempt | null> {
  if (!ref) return null
  return (await prisma.paymentAttempt.findUnique({ where: { reference: ref } }))
    ?? (await prisma.paymentAttempt.findFirst({ where: { providerRef: ref }, orderBy: { createdAt: 'desc' } }))
}
