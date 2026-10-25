import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { getCart } from '@/lib/shop/data'
import { cartSchema } from '@/lib/shop/schemas'
import { MAX_QTY_PER_LINE } from '@/lib/shop/shared'
import { isObjectId } from '@/lib/server/object-id'

/** GET /api/shop/cart — the signed-in member's shop cart, with live prices and stock. */
export const GET = withErrorHandling('/api/shop/cart', 'GET', async () => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  return NextResponse.json({ data: await getCart(auth.session.userId), message: 'Cart fetched', code: 'success', status: 200 })
})

/**
 * POST /api/shop/cart { productId, quantity, mode: 'add' | 'set' } — add to
 * cart (add) or change a line's quantity (set; 0 removes it). Never more than
 * what is in stock. Returns the whole updated cart.
 */
export const POST = withErrorHandling('/api/shop/cart', 'POST', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const parsed = cartSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const { productId, quantity, mode } = parsed.data
  const userId = auth.session.userId
  if (!isObjectId(productId)) throw new ApiError('Product not found', 404)

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { title: true, stockQty: true, status: true, deletedAt: true } })
  if (!product || product.status !== 'ACTIVE' || product.deletedAt) throw new ApiError('This product is no longer for sale', 404)

  const key = { userId_productId: { userId, productId } }
  const current = await prisma.productCartItem.findUnique({ where: key, select: { quantity: true } })
  const wanted = mode === 'add' ? (current?.quantity ?? 0) + quantity : quantity
  let message = mode === 'add' ? `Added “${product.title}” to your cart` : 'Cart updated'

  if (wanted <= 0) {
    await prisma.productCartItem.deleteMany({ where: { userId, productId } })
    message = `Removed “${product.title}” from your cart`
  } else {
    if (product.stockQty <= 0) throw new ApiError(`“${product.title}” is sold out`, 409)
    const capped = Math.min(wanted, product.stockQty, MAX_QTY_PER_LINE)
    if (capped < wanted) message = `Only ${capped} of “${product.title}” available — your cart has ${capped}`
    await prisma.productCartItem.upsert({ where: key, create: { userId, productId, quantity: capped }, update: { quantity: capped } })
  }
  return NextResponse.json({ data: await getCart(userId), message, code: 'success', status: 200 })
})

/** DELETE /api/shop/cart?productId= — remove one line (no productId = empty the cart). */
export const DELETE = withErrorHandling('/api/shop/cart', 'DELETE', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const productId = new URL(request.url).searchParams.get('productId')
  await prisma.productCartItem.deleteMany({ where: { userId: auth.session.userId, ...(productId && { productId }) } })
  return NextResponse.json({ data: await getCart(auth.session.userId), message: productId ? 'Removed from your cart' : 'Cart emptied', code: 'success', status: 200 })
})
