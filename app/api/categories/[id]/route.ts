import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

interface RouteParams {
  params: Promise<{ id: string }>
}

function serializeCategory(c: {
  id: string
  slug: string
  nameEn: string
  nameFr: string
  nameRw: string
  parentId: string | null
  code: string | null
  subtitle: string | null
  range: string | null
  theme: string | null
  description: string | null
  detail: string | null
  heroImage: string | null
  status: string | null
  createdAt: Date
}) {
  return {
    id: c.id,
    slug: c.slug,
    name: { en: c.nameEn, fr: c.nameFr, rw: c.nameRw },
    parentId: c.parentId,
    code: c.code ?? undefined,
    subtitle: c.subtitle ?? undefined,
    range: c.range ?? undefined,
    theme: c.theme ?? undefined,
    description: c.description ?? undefined,
    detail: c.detail ?? undefined,
    heroImage: c.heroImage ?? undefined,
    status: c.status ?? undefined,
    createdAt: c.createdAt.toISOString().split('T')[0],
  }
}

/**
 * Live resource count for a category — recursive for roots (includes
 * every child scroll's own resources too), matching the mock's
 * `resourceCountFor` semantics exactly (see lib/kcs-taxonomy/
 * taxonomy-helpers.ts's docstring for why roots are recursive).
 */
async function resourceCountFor(categoryId: string): Promise<number> {
  const children = await prisma.category.findMany({ where: { parentId: categoryId }, select: { id: true } })
  const ids = [categoryId, ...children.map((c) => c.id)]
  return prisma.resource.count({ where: { categoryId: { in: ids } } })
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) {
    return NextResponse.json({ data: null, message: 'Category not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: serializeCategory(category), message: 'Category fetched successfully', code: 'success', status: 200 })
}

const updateCategorySchema = z.object({
  slug: z.string().trim().min(1).optional(),
  name: z.object({
    en: z.string().trim().min(1).optional(),
    fr: z.string().trim().optional(),
    rw: z.string().trim().optional(),
  }).optional(),
  parentId: z.string().nullable().optional(),
  code: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  range: z.string().trim().optional(),
  theme: z.string().trim().optional(),
  description: z.string().trim().optional(),
  detail: z.string().trim().optional(),
  heroImage: z.string().trim().optional(),
  status: z.enum(['AVAILABLE', 'ARCHIVED', 'OUT_OF_STOCK']).optional(),
})

export const PATCH = withErrorHandling('/api/categories/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updateCategorySchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Category not found', 404)

  if (body.slug && body.slug !== existing.slug) {
    const slugTaken = await prisma.category.findUnique({ where: { slug: body.slug } })
    if (slugTaken) throw new ApiError(`A category with slug "${body.slug}" already exists`, 409)
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.name?.en !== undefined && { nameEn: body.name.en }),
      ...(body.name?.fr !== undefined && { nameFr: body.name.fr }),
      ...(body.name?.rw !== undefined && { nameRw: body.name.rw }),
      ...(body.parentId !== undefined && { parentId: body.parentId }),
      ...(body.code !== undefined && { code: body.code }),
      ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
      ...(body.range !== undefined && { range: body.range }),
      ...(body.theme !== undefined && { theme: body.theme }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.detail !== undefined && { detail: body.detail }),
      ...(body.heroImage !== undefined && { heroImage: body.heroImage }),
      ...(body.status !== undefined && { status: body.status }),
    },
  })

  return NextResponse.json({ data: serializeCategory(category), message: 'Category updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/categories/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Category not found', 404)

  const count = await resourceCountFor(id)
  if (count > 0) throw new ApiError(`Cannot delete — ${count} resource(s) still assigned to this category`, 409)

  const childCount = await prisma.category.count({ where: { parentId: id } })
  if (childCount > 0) throw new ApiError(`Cannot delete — ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'} still exist under this category`, 409)

  await prisma.category.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Category deleted successfully', code: 'success', status: 200 })
})
