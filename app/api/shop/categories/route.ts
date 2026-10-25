import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { listCategories } from '@/lib/shop/data'
import { categorySchema } from '@/lib/shop/schemas'
import { SHOP_PERMISSION } from '@/lib/shop/shared'

const DENIED = 'Your role cannot manage the shop. Ask an admin to grant "Manage Shop" in Roles & Permissions.'

/** GET /api/shop/categories — public: active categories. ?all=1 — "shop:manage": all, with product counts. */
export const GET = withErrorHandling('/api/shop/categories', 'GET', async (request: NextRequest) => {
  if (new URL(request.url).searchParams.get('all') === '1') {
    const auth = await requirePermission(SHOP_PERMISSION, DENIED)
    if (auth.response) return auth.response
    return NextResponse.json({ data: await listCategories({ withCounts: true }), message: 'Categories fetched', code: 'success', status: 200 })
  }
  return NextResponse.json({ data: await listCategories({ activeOnly: true }), message: 'Categories fetched', code: 'success', status: 200 })
})

/** POST /api/shop/categories — "shop:manage". */
export const POST = withErrorHandling('/api/shop/categories', 'POST', async (request: NextRequest) => {
  const auth = await requirePermission(SHOP_PERMISSION, DENIED)
  if (auth.response) return auth.response
  const parsed = categorySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const clash = await prisma.productCategory.findFirst({ where: { name: { equals: parsed.data.name, mode: 'insensitive' } }, select: { id: true } })
  if (clash) throw new ApiError('A category with this name already exists', 409)
  const max = await prisma.productCategory.aggregate({ _max: { sortOrder: true } })
  const created = await prisma.productCategory.create({
    data: { name: parsed.data.name, description: parsed.data.description || null, sortOrder: parsed.data.sortOrder ?? (max._max.sortOrder ?? 0) + 1, active: parsed.data.active ?? true },
  })
  return NextResponse.json({ data: { ...created, productCount: 0 }, message: 'Category added', code: 'success', status: 201 }, { status: 201 })
})
