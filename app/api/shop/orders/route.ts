import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { requirePermission } from '@/lib/auth/permissions'
import { listOrders } from '@/lib/shop/data'
import { placeOrder } from '@/lib/shop/orders'
import { placeOrderSchema } from '@/lib/shop/schemas'
import { SHOP_PERMISSION } from '@/lib/shop/shared'

/** GET /api/shop/orders — the member's own orders. ?all=1 (&status=) — "shop:manage": every order. */
export const GET = withErrorHandling('/api/shop/orders', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('all') === '1') {
    const auth = await requirePermission(SHOP_PERMISSION)
    if (auth.response) return auth.response
    return NextResponse.json({ data: await listOrders({ status: searchParams.get('status') ?? undefined }), message: 'Orders fetched', code: 'success', status: 200 })
  }
  const auth = await requireAuth()
  if (auth.response) return auth.response
  return NextResponse.json({ data: await listOrders({ userId: auth.session.userId }), message: 'Orders fetched', code: 'success', status: 200 })
})

/**
 * POST /api/shop/orders — checkout: turns the cart into an order, reserves
 * stock and starts the payment (PayPack prompt on the phone, or a Stripe card
 * page in `checkoutUrl`).
 */
export const POST = withErrorHandling('/api/shop/orders', 'POST', async (request: NextRequest) => {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  const parsed = placeOrderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const user = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { email: true } })
  if (!user) throw new ApiError('Your account was not found — sign in again', 401)
  const result = await placeOrder({ ...parsed.data, userId: auth.session.userId, buyerEmail: user.email })
  return NextResponse.json({ data: result, message: result.message, code: 'success', status: 201 }, { status: 201 })
})
