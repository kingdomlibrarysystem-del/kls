import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

interface RouteParams {
  params: Promise<{ id: string }>
}

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
}) {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    publisher: r.publisher,
    categoryId: r.categoryId ?? '',
    type: r.type,
    format: r.format,
    language: r.language,
    year: r.year,
    pages: r.pages,
    isbn: r.isbn,
    price: r.price,
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
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  const resource = await prisma.resource.findUnique({ where: { id } })
  if (!resource) {
    return NextResponse.json({ data: null, message: 'Resource not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: serializeResource(resource), message: 'Resource fetched successfully', code: 'success', status: 200 })
}

/**
 * Full update (mirrors the mock's `updateResource`, which accepts any
 * partial patch — including a status-only patch, which is exactly what
 * the mock's `archiveResource` helper does under the hood). No separate
 * archive endpoint: the frontend's archive action just PATCHes
 * `{ status: 'archived' }`, same as it called `updateResource` before.
 */
const updateResourceSchema = z.object({
  title: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  publisher: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  language: z.string().optional(),
  year: z.number().int().optional(),
  pages: z.number().int().nonnegative().optional(),
  isbn: z.string().optional(),
  price: z.number().nonnegative().optional(),
  freePreviewChapterCount: z.number().int().nonnegative().optional(),
  totalQty: z.number().int().nonnegative().optional(),
  availableQty: z.number().int().nonnegative().optional(),
  status: z.string().optional(),
  coverImages: z.array(z.string()).optional(),
  bindingType: z.string().optional(),
  mediaType: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  documentUrl: z.string().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
})

export const PATCH = withErrorHandling('/api/resources/[id]', 'PATCH', async (request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = updateResourceSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Resource not found', 404)

  if (body.categoryId && body.categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } })
    if (!category) throw new ApiError('The specified category does not exist', 400)
  }

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.author !== undefined) data.author = body.author
  if (body.publisher !== undefined) data.publisher = body.publisher
  if (body.categoryId !== undefined) data.categoryId = body.categoryId
  if (body.type !== undefined) data.type = body.type
  if (body.format !== undefined) data.format = body.format
  if (body.language !== undefined) data.language = body.language
  if (body.year !== undefined) data.year = body.year
  if (body.pages !== undefined) data.pages = body.pages
  if (body.isbn !== undefined) data.isbn = body.isbn
  if (body.price !== undefined) data.price = body.price
  if (body.freePreviewChapterCount !== undefined) data.freePreviewChapterCount = body.freePreviewChapterCount
  if (body.totalQty !== undefined) data.totalQty = body.totalQty
  if (body.availableQty !== undefined) data.availableQty = body.availableQty
  if (body.status !== undefined) data.status = body.status.toUpperCase()
  if (body.coverImages !== undefined) data.coverImages = body.coverImages
  if (body.bindingType !== undefined) data.bindingType = body.bindingType
  if (body.mediaType !== undefined) data.mediaType = body.mediaType
  if (body.description !== undefined) data.description = body.description
  if (body.tags !== undefined) data.tags = body.tags
  if (body.documentUrl !== undefined) data.documentUrl = body.documentUrl
  if (body.audioUrl !== undefined) data.audioUrl = body.audioUrl
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl

  const resource = await prisma.resource.update({ where: { id }, data })

  return NextResponse.json({ data: serializeResource(resource), message: 'Resource updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/resources/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params

  const existing = await prisma.resource.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Resource not found', 404)

  await prisma.resource.delete({ where: { id } })

  return NextResponse.json({ data: null, message: 'Resource deleted successfully', code: 'success', status: 200 })
})
