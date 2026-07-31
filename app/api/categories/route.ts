import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Category API — the KCS taxonomy (8 root pillars + ~75 child
 * scrolls), replacing the old fully-mocked Technology/Science/History/
 * Literature placeholder that had nothing to do with this app's real
 * domain. Response shape maps the DB's flat `nameEn`/`nameFr`/`nameRw`
 * fields back into the `{ en, fr, rw }` object shape
 * `lib/kcs-taxonomy`'s `Category` type already uses, so the frontend
 * store can be rewired with minimal shape changes.
 */
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
  updatedAt: Date
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '100')
  const search = searchParams.get('search')?.toLowerCase()
  const parentId = searchParams.get('parentId')

  const where = {
    ...(search && {
      OR: [
        { nameEn: { contains: search, mode: 'insensitive' as const } },
        { nameFr: { contains: search, mode: 'insensitive' as const } },
        { nameRw: { contains: search, mode: 'insensitive' as const } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(parentId === 'null' && { parentId: null }),
    ...(parentId && parentId !== 'null' && { parentId }),
  }

  const [totalItems, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: categories.map(serializeCategory),
    message: 'Categories fetched successfully',
    code: 'success',
    status: 200,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.slug || !body.name?.en) {
      return NextResponse.json({ data: null, message: 'Missing required fields: slug, name.en', code: 'error', status: 400 }, { status: 400 })
    }

    const existing = await prisma.category.findUnique({ where: { slug: body.slug } })
    if (existing) {
      return NextResponse.json({ data: null, message: `A category with slug "${body.slug}" already exists`, code: 'error', status: 409 }, { status: 409 })
    }

    if (body.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: body.parentId } })
      if (!parent) {
        return NextResponse.json({ data: null, message: 'The specified parent category does not exist', code: 'error', status: 400 }, { status: 400 })
      }
    }

    const category = await prisma.category.create({
      data: {
        slug: body.slug,
        nameEn: body.name.en,
        nameFr: body.name.fr ?? body.name.en,
        nameRw: body.name.rw ?? body.name.en,
        parentId: body.parentId ?? null,
      },
    })

    return NextResponse.json({ data: serializeCategory(category), message: 'Category created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create category', code: 'error', status: 500 }, { status: 500 })
  }
}
