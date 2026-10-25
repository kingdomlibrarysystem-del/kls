import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { serializeResource, getResourceDetail } from '@/lib/data/resources'
import { isValidMediaTypeCode } from '@/lib/data/media-types'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import { assignKlpCodes, isValidCollection } from '@/lib/data/klp-register'
import { isKlpFormat, normalizeIsbn } from '@/lib/klp-code'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params

  // A draft is only visible to staff (the approval preview); readers get a 404 as if it didn't exist.
  const session = await getServerSession(authOptions)
  const isStaff = !!session?.user?.id && roleNameToUserRole(session.user.roleName ?? '') !== 'member'
  const resource = await getResourceDetail(id, { includeDraft: isStaff })
  if (!resource) {
    return NextResponse.json({ data: null, message: 'Resource not found', code: 'error', status: 404 }, { status: 404 })
  }

  return NextResponse.json({ data: resource, message: 'Resource fetched successfully', code: 'success', status: 200 })
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
  /** Official ISBN from the agency ('' clears it back to pending). The internal `isbn` key is never editable. */
  officialIsbn: z.string().optional(),
  klpCollection: z.string().regex(/^\d{2}$/, 'Collection must be a 2-digit code').optional().or(z.literal('')),
  klpEdition: z.number().int().min(1).max(99).optional(),
  klpFormat: z.string().optional().or(z.literal('')),
  price: z.number().nonnegative().optional(),
  borrowPrice: z.number().nonnegative().optional(),
  borrowDurationDays: z.number().int().positive().optional(),
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
  if (body.officialIsbn !== undefined) {
    const raw = body.officialIsbn.trim()
    const isbn = raw ? normalizeIsbn(raw) : null
    if (raw && !isbn) throw new ApiError('That ISBN is not valid — check the digits (ISBN-13 or ISBN-10), or leave it empty while it is pending.', 400)
    data.officialIsbn = isbn
  }
  // The code parts are frozen once the KLP code is assigned — a new edition or format is a new record.
  if (!existing.klpCode) {
    if (body.klpCollection !== undefined) {
      if (body.klpCollection && !(await isValidCollection(body.klpCollection))) throw new ApiError('The specified KLP collection does not exist', 400)
      data.klpCollection = body.klpCollection || null
    }
    if (body.klpEdition !== undefined) data.klpEdition = body.klpEdition
    if (body.klpFormat !== undefined) {
      if (body.klpFormat && !isKlpFormat(body.klpFormat)) throw new ApiError('Unknown publication format', 400)
      data.klpFormat = body.klpFormat || null
    }
  }
  if (body.price !== undefined) data.price = body.price
  if (body.borrowPrice !== undefined) data.borrowPrice = body.borrowPrice
  if (body.borrowDurationDays !== undefined) data.borrowDurationDays = body.borrowDurationDays
  if (body.freePreviewChapterCount !== undefined) data.freePreviewChapterCount = body.freePreviewChapterCount
  if (body.totalQty !== undefined) data.totalQty = body.totalQty
  if (body.availableQty !== undefined) data.availableQty = body.availableQty
  if (body.status !== undefined) {
    const next = body.status.toUpperCase()
    if (!['AVAILABLE', 'OUT_OF_STOCK', 'ARCHIVED', 'DRAFT'].includes(next)) throw new ApiError('Unknown status', 400)
    // Publishing a draft is an approval (permission + codes + notifications) — only via /review.
    if (existing.status === 'DRAFT' && next !== 'DRAFT') throw new ApiError('This resource is a draft. Approve it to publish it.', 409)
    if (existing.status !== 'DRAFT' && next === 'DRAFT') throw new ApiError('A published resource cannot go back to draft — archive it instead.', 409)
    data.status = next
  }
  if (body.coverImages !== undefined) data.coverImages = body.coverImages
  if (body.bindingType !== undefined) data.bindingType = body.bindingType
  if (body.mediaType !== undefined) {
    if (!(await isValidMediaTypeCode(body.mediaType))) throw new ApiError('The specified media type does not exist', 400)
    data.mediaType = body.mediaType
  }
  if (body.description !== undefined) data.description = body.description
  if (body.tags !== undefined) data.tags = body.tags
  if (body.documentUrl !== undefined) data.documentUrl = body.documentUrl
  if (body.audioUrl !== undefined) data.audioUrl = body.audioUrl
  if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl

  let resource = await prisma.resource.update({ where: { id }, data })

  // A published record that just got its collection (e.g. an older title) receives its codes now.
  if (resource.status !== 'DRAFT' && !resource.klpCode && resource.klpCollection) {
    if (await assignKlpCodes(id)) resource = await prisma.resource.findUniqueOrThrow({ where: { id } })
  }

  const chapterCount = await prisma.chapter.count({ where: { resourceId: id } })

  return NextResponse.json({ data: serializeResource(resource, chapterCount), message: 'Resource updated successfully', code: 'success', status: 200 })
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
