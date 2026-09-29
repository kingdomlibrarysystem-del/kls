import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'
import { serializeCheckout } from '@/app/api/checkout/serialize'

/**
 * One checkout (with its line-item orders) in the GET /api/checkout/[id]
 * shape, plus its owner id. Stored state only — the route additionally
 * re-polls PayPack/Stripe while PENDING; the detail view does that one
 * refresh client-side when needed.
 */
export async function getCheckoutDetail(id: string) {
  if (!isObjectId(id)) return null
  const checkout = await prisma.checkout.findUnique({ where: { id }, include: { orders: true } })
  return checkout ? { ownerId: checkout.userId, checkout: serializeCheckout(checkout) } : null
}
