import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { generateUniqueIsbn } from '@/lib/generate-isbn'

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
  borrowPrice: number
  borrowDurationDays: number
  freePreviewChapterCount: number
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
  avgRating: number
  reviewCount: number
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
    borrowPrice: r.borrowPrice,
    borrowDurationDays: r.borrowDurationDays,
    freePreviewChapterCount: r.freePreviewChapterCount,
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
    avgRating: r.avgRating,
    reviewCount: r.reviewCount,
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
      orderBy: { createdAt: 'desc' },
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

const createResourceSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  author: z.string().trim().min(1, 'author is required'),
  categoryId: z.string().min(1, 'categoryId is required'),
  publisher: z.string().optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  language: z.string().optional(),
  year: z.number().int().optional(),
  pages: z.number().int().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  borrowPrice: z.number().nonnegative().optional(),
  borrowDurationDays: z.number().int().positive().optional(),
  freePreviewChapterCount: z.number().int().nonnegative().optional(),
  totalQty: z.number().int().nonnegative().optional(),
  availableQty: z.number().int().nonnegative().optional(),
  coverImages: z.array(z.string()).optional(),
  bindingType: z.string().optional(),
  mediaType: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  documentUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  videoUrl: z.string().optional(),
})

export const POST = withErrorHandling('/api/resources', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = createResourceSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const category = await prisma.category.findUnique({ where: { id: body.categoryId } })
  if (!category) throw new ApiError('The specified category does not exist', 400)

  const isbn = await generateUniqueIsbn()

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
      isbn,
      price: body.price ?? 0,
      borrowPrice: body.borrowPrice ?? 0,
      borrowDurationDays: body.borrowDurationDays ?? 14,
      freePreviewChapterCount: body.freePreviewChapterCount ?? 0,
      totalQty: body.totalQty ?? 1,
      availableQty: body.availableQty ?? body.totalQty ?? 1,
      status: 'AVAILABLE',
      coverImages: body.coverImages ?? [],
      bindingType: (body.bindingType as 'SOFT' | 'HARD') ?? 'SOFT',
      mediaType: (body.mediaType as 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'TEXT' | 'COMBINATION') ?? 'TEXT',
      description: body.description ?? '',
      tags: body.tags ?? [],
      documentUrl: body.documentUrl ?? null,
      audioUrl: body.audioUrl ?? null,
      videoUrl: body.videoUrl ?? null,
    },
  })

  return NextResponse.json({ data: serializeResource(resource), message: 'Resource created successfully', code: 'success', status: 201 }, { status: 201 })
})
