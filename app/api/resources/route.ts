import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Resource API — the digital library catalog, replacing the old
 * fully-mocked 4-row placeholder that used a different vocabulary
 * (`totalQuantity`/`availableQuantity`/lowercase `type`/`format`) than
 * this app's real `Resource` shape
 * (app/dashboard/library/_components/resources-data.ts). Response shape
 * matches that real interface field-for-field, with `status` normalized
 * back to the mock's lowercase convention (`available`/`out_of_stock`/
 * `archived`) since the DB enum is uppercase for schema-wide consistency
 * with `CategoryStatus`.
 */
function serializeResource(r: {
  id: string
  title: string
  author: string
  publisher: string
  categoryId: string | null
  type: string
  format: string
  language: string
  year: number
  pages: number
  isbn: string
  price: number
  totalQty: number
  availableQty: number
  status: string
  coverImages: string[]
  bindingType: string
  mediaType: string
  description: string
  tags: string[]
  documentUrl: string | null
  audioUrl: string | null
  videoUrl: string | null
}) {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    publisher: r.publisher,
    // Publishing-created resources (see Publication.status PUBLISHED
    // auto-create) may have no KCS categoryId — the frontend Resource
    // type still expects a string, so this falls back to '' rather than
    // widening that type across ~19 existing consumers for one new case.
    categoryId: r.categoryId ?? '',
    type: r.type,
    format: r.format,
    language: r.language,
    year: r.year,
    pages: r.pages,
    isbn: r.isbn,
    price: r.price,
    totalQty: r.totalQty,
    availableQty: r.availableQty,
    status: r.status.toLowerCase(),
    coverImages: r.coverImages,
    bindingType: r.bindingType,
    mediaType: r.mediaType,
    description: r.description,
    tags: r.tags,
    documentUrl: r.documentUrl ?? undefined,
    audioUrl: r.audioUrl ?? undefined,
    videoUrl: r.videoUrl ?? undefined,
  }
}

const VALID_STATUSES = ['available', 'out_of_stock', 'archived']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const categoryId = searchParams.get('categoryId')
  const status = searchParams.get('status')

  const where = {
    ...(categoryId && { categoryId }),
    ...(status && status !== 'all' && VALID_STATUSES.includes(status) && { status: status.toUpperCase() as 'AVAILABLE' | 'OUT_OF_STOCK' | 'ARCHIVED' }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { author: { contains: search, mode: 'insensitive' as const } },
        { isbn: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, resources] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { title: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: resources.map(serializeResource),
    message: 'Resources fetched successfully',
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

    if (!body.title || !body.author || !body.categoryId) {
      return NextResponse.json({ data: null, message: 'Missing required fields: title, author, categoryId', code: 'error', status: 400 }, { status: 400 })
    }

    const category = await prisma.category.findUnique({ where: { id: body.categoryId } })
    if (!category) {
      return NextResponse.json({ data: null, message: 'The specified category does not exist', code: 'error', status: 400 }, { status: 400 })
    }

    const resource = await prisma.resource.create({
      data: {
        title: body.title,
        author: body.author,
        publisher: body.publisher ?? '',
        categoryId: body.categoryId,
        type: body.type ?? 'Book',
        format: body.format ?? 'Physical',
        language: body.language ?? 'EN',
        year: body.year ?? new Date().getFullYear(),
        pages: body.pages ?? 0,
        isbn: body.isbn ?? '',
        price: body.price ?? 0,
        totalQty: body.totalQty ?? 1,
        availableQty: body.availableQty ?? body.totalQty ?? 1,
        status: 'AVAILABLE',
        coverImages: body.coverImages ?? [],
        bindingType: body.bindingType ?? 'SOFT',
        mediaType: body.mediaType ?? 'TEXT',
        description: body.description ?? '',
        tags: body.tags ?? [],
        documentUrl: body.documentUrl ?? null,
        audioUrl: body.audioUrl ?? null,
        videoUrl: body.videoUrl ?? null,
      },
    })

    return NextResponse.json({ data: serializeResource(resource), message: 'Resource created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create resource', code: 'error', status: 500 }, { status: 500 })
  }
}
