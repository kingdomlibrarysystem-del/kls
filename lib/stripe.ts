import Stripe from 'stripe'

let cachedClient: Stripe | null = null

/** Lazily constructs the Stripe client so an unconfigured environment doesn't crash at import time — mirrors lib/livekit.ts's isConfigured pattern. */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

function getClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured for this environment')
  if (!cachedClient) cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  return cachedClient
}

interface CreateCheckoutSessionInput {
  /** Which order model this session is for — 'courseOrderId' | 'accessOrderId' — read back out of session/payment_intent metadata by the matching webhook branch. Kept as a caller-supplied key rather than a second hardcoded param so a third order type doesn't need a third near-duplicate function. */
  metadataKey: string
  orderId: string
  title: string
  amountRwf: number
  successUrl: string
  cancelUrl: string
}

/**
 * Creates a real Stripe Checkout Session for one purchase (a course
 * enrollment, or a paid Borrow/Reservation access order). RWF is a real
 * zero-decimal currency Stripe supports natively (no cents multiplication
 * needed, unlike USD), so amountRwf is used directly as unit_amount —
 * keeps pricing in the same unit PayPack already uses instead of
 * introducing a second currency convention alongside it.
 */
export async function createCheckoutSession({ metadataKey, orderId, title, amountRwf, successUrl, cancelUrl }: CreateCheckoutSessionInput): Promise<{ id: string; url: string }> {
  const stripe = getClient()
  const metadata = { [metadataKey]: orderId }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'rwf',
        unit_amount: Math.round(amountRwf),
        product_data: { name: title },
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data: { metadata },
  })
  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return { id: session.id, url: session.url }
}

/** Real-time reconciliation fallback, mirroring lib/paypack.ts's findTransaction — used when a webhook delivery hasn't arrived yet. */
export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getClient()
  return stripe.checkout.sessions.retrieve(sessionId)
}

/** Verifies the real Stripe webhook signature against the raw request body — same raw-bytes-before-parsing requirement as PayPack's own webhook. */
export function constructStripeWebhookEvent(rawBody: string, signatureHeader: string | null): Stripe.Event {
  if (!signatureHeader) throw new Error('Missing Stripe signature header')
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  const stripe = getClient()
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, process.env.STRIPE_WEBHOOK_SECRET)
}
