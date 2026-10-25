import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { listAllProducts, listShopProducts, serializeProduct, type ProductSort } from '@/lib/shop/data'
import { productSchema } from '@/lib/shop/schemas'
import { SHOP_PERMISSION } from '@/lib/shop/shared'
import { isObjectId } from '@/lib/server/object-id'

const DENIED = 'Your role cannot manage the shop. Ask an admin to grant "Manage Shop" in Roles & Permissions.'

/**
 * GET /api/shop/products — public: products for sale (?category=&q=&sort=newest|price-asc|price-desc|popular).
 * ?all=1 — staff with "shop:manage": every product incl. drafts, archived and Trash.
 */
export const GET = withErrorHandling('/api/shop/products', 'GET', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('all') === '1') {
    const auth = await requirePermission(SHOP_PERMISSION, DENIED)
    if (auth.response) return auth.response
    return NextResponse.json({ data: await listAllProducts(), message: 'Products fetched', code: 'success', status: 200 })
  }
  const sort = (['newest', 'price-asc', 'price-desc', 'popular'].includes(searchParams.get('sort') ?? '') ? searchParams.get('sort') : 'newest') as ProductSort
  const data = await listShopProducts({ categoryId: searchParams.get('category') ?? undefined, q: searchParams.get('q')?.trim() || undefined, sort })
  return NextResponse.json({ data, message: 'Products fetched', code: 'success', status: 200 })
})

/** POST /api/shop/products — "shop:manage": add a product. */
export const POST = withErrorHandling('/api/shop/products', 'POST', async (request: NextRequest) => {
  const auth = await requirePermission(SHOP_PERMISSION, DENIED)
  if (auth.response) return auth.response
  const parsed = productSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data
  if (!isObjectId(body.categoryId) || !(await prisma.productCategory.findUnique({ where: { id: body.categoryId }, select: { id: true } }))) {
    throw new ApiError('Choose a category', 400)
  }
  if (body.compareAtPriceRwf != null && body.compareAtPriceRwf > 0 && body.compareAtPriceRwf <= body.priceRwf) {
    throw new ApiError('The "was" price must be higher than the price (or leave it empty)', 400)
  }
  const user = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { name: true, firstName: true, lastName: true } })
  const product = await prisma.product.create({
    data: {
      ...body,
      compareAtPriceRwf: body.compareAtPriceRwf || null,
      createdById: auth.session.userId,
      createdByName: (user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()) || 'Staff',
    },
    include: { category: { select: { name: true } } },
  })
  return NextResponse.json({ data: serializeProduct(product), message: 'Product added', code: 'success', status: 201 }, { status: 201 })
})
