import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/**
 * Real shopping cart API — one Cart per userId (see Cart's schema
 * docstring for why no guest-cart concept exists). GET returns the
 * caller's cart with each item's live Resource data joined in, so the
 * cart page can show title/cover/price without a second round trip;
 * POST adds an item, upserting the Cart row itself on first use.
 */
function serializeCartItem(item: {
  id: string
  resourceId: string
  type: string
  quantity: number
  addedAt: Date
  resource: { id: string; title: string; author: string; price: number; borrowPrice: number; coverImages: string[] }
}) {
  // RENTAL (Borrow) charges resource.borrowPrice; SALE (Reserve) charges
  // resource.price — the two products have their own independent
  // pricing now, not the same shared field.
  const unitPriceRwf = item.type === 'RENTAL' ? item.resource.borrowPrice : item.resource.price
  return {
    id: item.id,
    resourceId: item.resourceId,
    resourceTitle: item.resource.title,
    resourceAuthor: item.resource.author,
    resourceCover: item.resource.coverImages[0] ?? null,
    unitPriceRwf,
    type: item.type,
    quantity: item.quantity,
    addedAt: item.addedAt.toISOString(),
  }
}

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { resource: { select: { id: true, title: true, author: true, price: true, borrowPrice: true, coverImages: true } } }, orderBy: { addedAt: 'asc' } } },
  })
}

export const GET = withErrorHandling('/api/cart', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) throw new ApiError('userId is required', 400)

  const auth = await requireOwnerOrStaff(userId)
  if (auth.response) return auth.response

  const cart = await getOrCreateCart(userId)
  const items = cart.items.map(serializeCartItem)
  const totalRwf = items.reduce((sum, i) => sum + i.unitPriceRwf * i.quantity, 0)

  return NextResponse.json({
    data: { id: cart.id, items, totalRwf },
    message: 'Cart fetched successfully',
    code: 'success',
    status: 200,
  })
})

const addToCartSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  type: z.enum(['SALE', 'RENTAL']),
})

export const POST = withErrorHandling('/api/cart', 'POST', async (request: NextRequest) => {
  const parsed = addToCartSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const resource = await prisma.resource.findUnique({ where: { id: body.resourceId } })
  if (!resource) throw new ApiError('Resource not found', 404)
  // SALE (Reserve) always requires a real price. RENTAL (Borrow) is
  // allowed to be free (borrowPrice defaults to 0) — its real product
  // constraint is the return period, not necessarily a charge.
  if (body.type === 'SALE' && (!resource.price || resource.price <= 0)) {
    throw new ApiError('This resource has no price set', 400)
  }

  const cart = await prisma.cart.upsert({ where: { userId: body.userId }, update: {}, create: { userId: body.userId } })

  await prisma.cartItem.upsert({
    where: { cartId_resourceId_type: { cartId: cart.id, resourceId: body.resourceId, type: body.type } },
    update: {},
    create: { cartId: cart.id, resourceId: body.resourceId, type: body.type },
  })

  const updated = await getOrCreateCart(body.userId)
  const items = updated.items.map(serializeCartItem)
  const totalRwf = items.reduce((sum, i) => sum + i.unitPriceRwf * i.quantity, 0)

  return NextResponse.json(
    { data: { id: updated.id, items, totalRwf }, message: 'Added to cart', code: 'success', status: 201 },
    { status: 201 }
  )
})
