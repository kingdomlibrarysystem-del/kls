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
  /** Which order model this session is for, e.g. 'courseOrderId' — read back out of session/payment_intent metadata by the matching webhook branch. Kept as a caller-supplied key rather than a hardcoded param so a future order type reuses this function instead of a near-duplicate. */
  metadataKey: string
  orderId: string
  title: string
  amountRwf: number
  successUrl: string
  cancelUrl: string
  /** Real product photo shown on the Stripe-hosted page next to this line item — omitted (not an empty array) when the item has no cover, since Stripe rejects an empty images array. */
  imageUrl?: string | null
}

/**
 * Creates a real Stripe Checkout Session for one purchase (currently
 * only course enrollment — see app/api/course-orders/route.ts). RWF is a
 * real zero-decimal currency Stripe supports natively (no cents
 * multiplication needed, unlike USD), so amountRwf is used directly as
 * unit_amount — keeps pricing in the same unit PayPack already uses
 * instead of introducing a second currency convention alongside it.
 */
export async function createCheckoutSession({ metadataKey, orderId, title, amountRwf, successUrl, cancelUrl, imageUrl }: CreateCheckoutSessionInput): Promise<{ id: string; url: string }> {
  const stripe = getClient()
  const metadata = { [metadataKey]: orderId }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'rwf',
        unit_amount: Math.round(amountRwf),
        product_data: { name: title, ...(imageUrl && { images: [imageUrl] }) },
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

interface CheckoutLineItem {
  title: string
  amountRwf: number
  quantity: number
  imageUrl?: string | null
}

interface CreateMultiItemCheckoutSessionInput {
  metadataKey: string
  orderId: string
  items: CheckoutLineItem[]
  successUrl: string
  cancelUrl: string
}

/**
 * Multi-item sibling of createCheckoutSession — one real Stripe Checkout
 * Session with one line_items entry per cart item, for the combined
 * "pay the whole cart at once" checkout (see app/api/checkout/route.ts).
 * Each item carries its own real cover image, so Stripe's hosted page
 * shows every book/resource being paid for, not just a single summed
 * amount.
 */
export async function createMultiItemCheckoutSession({ metadataKey, orderId, items, successUrl, cancelUrl }: CreateMultiItemCheckoutSessionInput): Promise<{ id: string; url: string }> {
  const stripe = getClient()
  const metadata = { [metadataKey]: orderId }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: items.map((item) => ({
      price_data: {
        currency: 'rwf',
        unit_amount: Math.round(item.amountRwf),
        product_data: { name: item.title, ...(item.imageUrl && { images: [item.imageUrl] }) },
      },
      quantity: item.quantity,
    })),
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
