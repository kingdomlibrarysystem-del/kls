import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requirePermission } from '@/lib/auth/permissions'
import { categorySchema } from '@/lib/shop/schemas'
import { SHOP_PERMISSION } from '@/lib/shop/shared'
import { isObjectId } from '@/lib/server/object-id'

type Ctx = { params: Promise<{ id: string }> }
const DENIED = 'Your role cannot manage the shop. Ask an admin to grant "Manage Shop" in Roles & Permissions.'

async function find(id: string) {
  if (!isObjectId(id)) throw new ApiError('Category not found', 404)
  const c = await prisma.productCategory.findUnique({ where: { id } })
  if (!c) throw new ApiError('Category not found', 404)
  return c
}

/** PATCH /api/shop/categories/[id] — rename, describe, reorder, show/hide. */
export const PATCH = withErrorHandling('/api/shop/categories/[id]', 'PATCH', async (request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SHOP_PERMISSION, DENIED)
  if (auth.response) return auth.response
  const { id } = await params
  await find(id)
  const parsed = categorySchema.partial().safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  if (parsed.data.name) {
    const clash = await prisma.productCategory.findFirst({ where: { name: { equals: parsed.data.name, mode: 'insensitive' }, id: { not: id } }, select: { id: true } })
    if (clash) throw new ApiError('A category with this name already exists', 409)
  }
  const updated = await prisma.productCategory.update({ where: { id }, data: { ...parsed.data, ...(parsed.data.description !== undefined && { description: parsed.data.description || null }) } })
  return NextResponse.json({ data: updated, message: 'Category saved', code: 'success', status: 200 })
})

/** DELETE /api/shop/categories/[id] — only when no product (not even in Trash) uses it. */
export const DELETE = withErrorHandling('/api/shop/categories/[id]', 'DELETE', async (_request: NextRequest, { params }: Ctx) => {
  const auth = await requirePermission(SHOP_PERMISSION, DENIED)
  if (auth.response) return auth.response
  const { id } = await params
  await find(id)
  const used = await prisma.product.count({ where: { categoryId: id } })
  if (used > 0) throw new ApiError(`${used} product${used === 1 ? '' : 's'} still use this category — move them first, or hide the category instead`, 409)
  await prisma.productCategory.delete({ where: { id } })
  return NextResponse.json({ data: { id }, message: 'Category deleted', code: 'success', status: 200 })
})
