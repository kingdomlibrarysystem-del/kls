import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import prisma from '@/prisma/client'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'
import { isValidMediaTypeCode, DEFAULT_MEDIA_TYPE_CODE } from '@/lib/data/media-types'
import { serializeResource, READER_VISIBLE_STATUSES } from '@/lib/data/resources'
import { isValidCollection } from '@/lib/data/klp-register'
import { notifyDraftAwaitingApproval } from '@/lib/data/resource-review'
import { isKlpFormat, normalizeIsbn } from '@/lib/klp-code'
import { newObjectId } from '@/lib/server/object-id'

/**
 * The digital library catalog. Response shape matches the client Resource
 * interface (app/dashboard/library/_components/resources-data.ts), with
 * `status` lower-cased (`draft`/`available`/`out_of_stock`/`archived`).
 *
 * Drafts (added but not yet approved) are only returned to staff who ask
 * for them with ?includeDrafts=1 — guests and members never receive them,
 * whatever they pass.
 */
const VALID_STATUSES = ['draft', 'available', 'out_of_stock', 'archived']
type DbStatus = 'DRAFT' | 'AVAILABLE' | 'OUT_OF_STOCK' | 'ARCHIVED'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const pageSize = Math.min(1000, Math.max(1, parseInt(searchParams.get('pageSize') || '50') || 50))
  const search = searchParams.get('search')?.toLowerCase()
  const categoryId = searchParams.get('categoryId')
  const status = searchParams.get('status')

  let canSeeDrafts = false
  if (searchParams.get('includeDrafts') === '1') {
    const session = await getServerSession(authOptions)
    canSeeDrafts = !!session?.user?.id && roleNameToUserRole(session.user.roleName ?? '') !== 'member'
  }
  const visible: DbStatus[] = canSeeDrafts ? ['DRAFT', ...READER_VISIBLE_STATUSES] : [...READER_VISIBLE_STATUSES]
  const wanted = status && status !== 'all' && VALID_STATUSES.includes(status) ? (status.toUpperCase() as DbStatus) : null

  const where = {
    status: { in: wanted ? visible.filter((s) => s === wanted) : visible },
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { author: { contains: search, mode: 'insensitive' as const } },
        { klpCode: { contains: search, mode: 'insensitive' as const } },
        { libraryId: { contains: search.replace(/\s/g, '') } },
        { officialIsbn: { contains: search.replace(/[\s-]/g, '') } },
      ],
    }),
  }

  const [totalItems, resources, chapterCounts, viewCounts] = await Promise.all([
    prisma.resource.count({ where }),
    prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.chapter.groupBy({ by: ['resourceId'], _count: { _all: true } }),
    // Unique viewers per book (ResourceView) — one groupBy for the whole list.
    prisma.resourceView.groupBy({ by: ['resourceId'], _count: { _all: true } }).catch(() => [] as { resourceId: string; _count: { _all: number } }[]),
  ])

  const chapterCountByResource = new Map(chapterCounts.map((c) => [c.resourceId, c._count._all]))
  const viewsByResource = new Map(viewCounts.map((v) => [v.resourceId, v._count._all]))

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: resources.map((r) => serializeResource(r, chapterCountByResource.get(r.id) ?? 0, viewsByResource.get(r.id) ?? 0)),
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
  /** KLP collection code ("01"–"99"); needed before approval, can be chosen later. */
  klpCollection: z.string().regex(/^\d{2}$/, 'Collection must be a 2-digit code').optional().or(z.literal('')),
  klpEdition: z.number().int().min(1, 'Edition starts at 1').max(99).optional(),
  klpFormat: z.string().optional().or(z.literal('')),
  /** Real ISBN from the ISBN agency, if one has been assigned. Leave empty while pending. */
  officialIsbn: z.string().optional(),
})

/**
 * Every new resource starts as a DRAFT: hidden from readers until an Admin
 * (or a role with library:approve) publishes it via
 * POST /api/resources/[id]/review. Codes (KLP / Kingdom Library ID) are
 * assigned at that point, not here, so rejected drafts never use a number.
 */
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

  // Media types are admin-managed data: only an existing type's code may be stored.
  const mediaType = body.mediaType ?? DEFAULT_MEDIA_TYPE_CODE
  if (!(await isValidMediaTypeCode(mediaType))) throw new ApiError('The specified media type does not exist', 400)

  if (body.klpCollection && !(await isValidCollection(body.klpCollection))) throw new ApiError('The specified KLP collection does not exist', 400)
  if (body.klpFormat && !isKlpFormat(body.klpFormat)) throw new ApiError('Unknown publication format', 400)
  let officialIsbn: string | null = null
  if (body.officialIsbn?.trim()) {
    officialIsbn = normalizeIsbn(body.officialIsbn)
    if (!officialIsbn) throw new ApiError('That ISBN is not valid — check the digits (ISBN-13 or ISBN-10), or leave it empty while it is pending.', 400)
  }

  // The legacy unique `isbn` column becomes an internal record key — never a self-made ISBN.
  const id = newObjectId()

  const resource = await prisma.resource.create({
    data: {
      id,
      isbn: `KL-${id}`,
      title: body.title,
      author: body.author,
      publisher: body.publisher ?? '',
      categoryId: body.categoryId,
      type: body.type ?? 'Book',
      format: body.format ?? 'Physical',
      language: body.language ?? 'EN',
      year: body.year ?? new Date().getFullYear(),
      pages: body.pages ?? 0,
      price: body.price ?? 0,
      borrowPrice: body.borrowPrice ?? 0,
      borrowDurationDays: body.borrowDurationDays ?? 14,
      freePreviewChapterCount: body.freePreviewChapterCount ?? 0,
      totalQty: body.totalQty ?? 1,
      availableQty: body.availableQty ?? body.totalQty ?? 1,
      status: 'DRAFT',
      coverImages: body.coverImages ?? [],
      bindingType: (body.bindingType as 'SOFT' | 'HARD') ?? 'SOFT',
      mediaType,
      description: body.description ?? '',
      tags: body.tags ?? [],
      documentUrl: body.documentUrl ?? null,
      audioUrl: body.audioUrl ?? null,
      videoUrl: body.videoUrl ?? null,
      klpCollection: body.klpCollection || null,
      klpEdition: body.klpEdition ?? 1,
      klpFormat: body.klpFormat || null,
      officialIsbn,
      createdById: auth.session.userId,
    },
  })

  const creator = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { name: true } })
  notifyDraftAwaitingApproval(resource, auth.session.userId, creator?.name ?? '').catch(() => {})

  return NextResponse.json({ data: serializeResource(resource, 0), message: 'Saved as a draft. It stays hidden from readers until an admin approves it.', code: 'success', status: 201 }, { status: 201 })
})
