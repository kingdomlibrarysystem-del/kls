import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { getShopProduct, serializeProduct } from '@/lib/shop/data'
import { productSchema } from '@/lib/shop/schemas'
import { SHOP_PERMISSION } from '@/lib/shop/shared'
import { isObjectId } from '@/lib/server/object-id'

type Ctx = { params: Promise<{ id: string }> }
const DENIED = 'Your role cannot manage the shop. Ask an admin to grant "Manage Shop" in Roles & Permissions.'
const INCLUDE = { category: { select: { name: true } } } as const

/** GET /api/shop/products/[id] — public for products on sale. */
export const GET = withErrorHandling('/api/shop/products/[id]', 'GET', async (_request: NextRequest, { params }: Ctx) => {
  const { id } = await params
  const product = await getShopProduct(id)
  if (!product) throw new ApiError('Product not found', 404)
  return NextResponse.json({ data: product, message: 'Product fetched', code: 'success', status: 200 })
})

/** PATCH /api/shop/products/[id] — "shop:manage": edit fields, or { restore: true } to take it out of Trash. */
export const PATCH = withErrorHandling('/api/shop/products/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SHOP_PERMISSION, DENIED)
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id)) throw new ApiError('Product not found', 404)
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Product not found', 404)

  const raw = await request.json().catch(() => null)
  if (raw?.restore === true) {
    const restored = await prisma.product.update({ where: { id }, data: { deletedAt: null, deletedBy: null }, include: INCLUDE })
    return NextResponse.json({ data: serializeProduct(restored), message: 'Product restored', code: 'success', status: 200 })
  }
  const parsed = productSchema.partial().safeParse(raw)
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data
  if (body.categoryId && (!isObjectId(body.categoryId) || !(await prisma.productCategory.findUnique({ where: { id: body.categoryId }, select: { id: true } })))) {
    throw new ApiError('Choose a category', 400)
  }
  const price = body.priceRwf ?? existing.priceRwf
  const was = body.compareAtPriceRwf === undefined ? existing.compareAtPriceRwf : body.compareAtPriceRwf
  if (was != null && was > 0 && was <= price) throw new ApiError('The "was" price must be higher than the price (or leave it empty)', 400)

  const updated = await prisma.product.update({
    where: { id },
    data: { ...body, ...(body.compareAtPriceRwf !== undefined && { compareAtPriceRwf: body.compareAtPriceRwf || null }) },
    include: INCLUDE,
  })
  return NextResponse.json({ data: serializeProduct(updated), message: 'Product saved', code: 'success', status: 200 })
})

/**
 * DELETE /api/shop/products/[id] — "shop:manage". Moves the product to Trash
 * (hidden from the shop, restorable). ?permanent=1 deletes it for good — past
 * orders keep their own copy of the title, price and image.
 */
export const DELETE = withErrorHandling('/api/shop/products/[id]', 'DELETE', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SHOP_PERMISSION, DENIED)
  if (auth.response) return auth.response
  const { id } = await params
  if (!isObjectId(id) || !(await prisma.product.findUnique({ where: { id }, select: { id: true } }))) throw new ApiError('Product not found', 404)
  if (new URL(request.url).searchParams.get('permanent') === '1') {
    await prisma.productCartItem.deleteMany({ where: { productId: id } })
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ data: { id }, message: 'Product deleted permanently', code: 'success', status: 200 })
  }
  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: auth.session.userId } })
  return NextResponse.json({ data: { id }, message: 'Product moved to Trash', code: 'success', status: 200 })
})
