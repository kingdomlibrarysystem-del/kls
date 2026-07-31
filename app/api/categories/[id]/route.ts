import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  try {
    const body = await request.json()
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Category not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.slug && body.slug !== existing.slug) {
      const slugTaken = await prisma.category.findUnique({ where: { slug: body.slug } })
      if (slugTaken) {
        return NextResponse.json({ data: null, message: `A category with slug "${body.slug}" already exists`, code: 'error', status: 409 }, { status: 409 })
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.name?.en !== undefined && { nameEn: body.name.en }),
        ...(body.name?.fr !== undefined && { nameFr: body.name.fr }),
        ...(body.name?.rw !== undefined && { nameRw: body.name.rw }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
      },
    })

    return NextResponse.json({ data: serializeCategory(category), message: 'Category updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update category', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Category not found', code: 'error', status: 404 }, { status: 404 })
  }

  const count = await resourceCountFor(id)
  if (count > 0) {
    return NextResponse.json(
      { data: null, message: `Cannot delete — ${count} resource(s) still assigned to this category`, code: 'error', status: 409 },
      { status: 409 }
    )
  }

  const childCount = await prisma.category.count({ where: { parentId: id } })
  if (childCount > 0) {
    return NextResponse.json(
      { data: null, message: `Cannot delete — ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'} still exist under this category`, code: 'error', status: 409 },
      { status: 409 }
    )
  }

  await prisma.category.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Category deleted successfully', code: 'success', status: 200 })
}
