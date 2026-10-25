import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { requirePermission } from '@/lib/auth/permissions'
import { getMediaCapabilities, isValidMediaTypeCode } from '@/lib/data/media-types'
import { REVENUE_INCLUDE, findKcsCategory, serializePublication } from '@/lib/data/publications'
import { notifySubmitted } from '@/lib/data/publication-notify'
import { cleanChapters, createPublicationSchema, missingForSubmit } from './schema'

/**
 * Publications API. A PUBLISHED row is the public catalog entry (read with
 * ?status=published or no filter); every other status needs auth. See
 * lib/data/publications.ts for the lifecycle.
 */
const VALID_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const status = searchParams.get('status')
  const contributorId = searchParams.get('contributorId')

  // Public access is allowed only for PUBLISHED records (no contributorId filter).
  // Any other query (by contributorId, or non-published status) requires auth.
  const isPublicCatalogRequest = !contributorId && (!status || status.toUpperCase() === 'PUBLISHED')

  if (!isPublicCatalogRequest) {
    const auth = await (contributorId ? requireOwnerOrStaff(contributorId) : requireStaff())
    if (auth.response) return auth.response
  }

  const where = {
    ...(isPublicCatalogRequest && { status: 'PUBLISHED' as const }),
    ...(contributorId && { contributorId }),
    ...(!isPublicCatalogRequest && status && status !== 'all' && VALID_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { contributorName: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, publications] = await Promise.all([
    prisma.publication.count({ where }),
    prisma.publication.findMany({
      where,
      include: REVENUE_INCLUDE,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: publications.map(serializePublication),
    message: 'Publications fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

/**
 * POST /api/publications — a publisher adds a book (role permission
 * "publications:submit"; Admin always). The book belongs to the signed-in
 * user. `submit: true` sends it for review (status SUBMITTED) — it is NOT
 * visible to members until a reviewer approves it; otherwise it is saved as
 * a DRAFT the publisher can finish later.
 */
export const POST = withErrorHandling('/api/publications', 'POST', async (request: NextRequest) => {
  const auth = await requirePermission('publications:submit', 'Your role cannot submit books. Ask an admin to grant "Submit Publications" in Roles & Permissions.')
  if (auth.response) return auth.response

  const parsed = createPublicationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const category = body.categoryId ? await findKcsCategory(body.categoryId) : null
  if (body.categoryId && !category) throw new ApiError('Choose a KCS category (a scroll under one of the pillars)', 400)
  if (body.mediaType && !(await isValidMediaTypeCode(body.mediaType))) throw new ApiError('The selected media type does not exist', 400)
  if (body.submit) {
    const missing = missingForSubmit({ ...body, chapters: cleanChapters(body.chapters) }, await getMediaCapabilities(body.mediaType))
    if (missing) throw new ApiError(missing, 400)
  }

  const contributor = await prisma.user.findUnique({ where: { id: auth.session.userId }, select: { name: true, firstName: true, lastName: true } })
  const contributorName = (contributor?.name || `${contributor?.firstName ?? ''} ${contributor?.lastName ?? ''}`.trim()) || 'Publisher'

  const publication = await prisma.publication.create({
    data: {
      title: body.title,
      contributorId: auth.session.userId,
      contributorName,
      author: body.author || contributorName,
      category: category?.name ?? '',
      categoryId: category?.id ?? null,
      language: (body.language ?? 'en').toUpperCase() as 'EN' | 'FR' | 'RW',
      coverImage: body.coverImage || null,
      description: body.description ?? '',
      mediaType: body.mediaType || null,
      documentUrl: body.documentUrl || null,
      chapters: cleanChapters(body.chapters),
      audioUrl: body.audioUrl || null,
      videoUrl: body.videoUrl || null,
      pages: body.pages ?? null,
      price: body.price ?? 0,
      borrowPrice: body.borrowPrice ?? 0,
      quantity: body.quantity ?? 1,
      status: body.submit ? 'SUBMITTED' : 'DRAFT',
      submittedAt: new Date(),
    },
    include: REVENUE_INCLUDE,
  })

  if (publication.status === 'SUBMITTED') await notifySubmitted(publication.contributorId, publication.contributorName, publication.title)

  return NextResponse.json(
    { data: serializePublication(publication), message: body.submit ? 'Book submitted for review' : 'Draft saved', code: 'success', status: 201 },
    { status: 201 },
  )
})
