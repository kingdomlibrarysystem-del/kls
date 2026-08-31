import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser, notifyAllStaff } from '@/lib/notify'
import { publicationSubmittedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

/**
 * Real Publication API, replacing the already-unified mock store at
 * app/dashboard/publishing/review/_components/review-data.ts +
 * use-review-queue.ts (submission lifecycle: DRAFT/SUBMITTED/
 * UNDER_REVIEW/APPROVED/REJECTED/PUBLISHED) AND
 * app/dashboard/publishing/catalog/_components/catalog-data.ts's
 * separate PublishedBook mock — a PUBLISHED Publication row IS the
 * catalog entry now, read via ?status=published, so there's no second
 * parallel model.
 */
function serializePublication(p: {
  id: string
  title: string
  contributorId: string
  contributorName: string
  category: string
  language: string
  coverImage: string | null
  description: string
  status: string
  resourceId: string | null
  price: number | null
  quantity: number | null
  bindingType: string | null
  mediaType: string | null
  featured: boolean
  submittedAt: Date
  revenueShare?: { contributorShare: number; platformShare: number; totalRevenue: number } | null
}) {
  return {
    id: p.id,
    title: p.title,
    contributorId: p.contributorId,
    contributor: p.contributorName,
    category: p.category,
    language: p.language.toLowerCase(),
    coverImage: p.coverImage ?? '',
    description: p.description,
    status: p.status,
    resourceId: p.resourceId ?? undefined,
    price: p.price ?? undefined,
    quantity: p.quantity ?? undefined,
    bindingType: p.bindingType ?? undefined,
    mediaType: p.mediaType ?? undefined,
    featured: p.featured,
    submittedAt: p.submittedAt.toISOString().split('T')[0],
    revenueShare: p.revenueShare
      ? { contributorShare: p.revenueShare.contributorShare, platformShare: p.revenueShare.platformShare, totalRevenue: p.revenueShare.totalRevenue }
      : undefined,
  }
}

const VALID_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED']
const REVENUE_INCLUDE = { revenueShare: { select: { contributorShare: true, platformShare: true, totalRevenue: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const status = searchParams.get('status')
  const contributorId = searchParams.get('contributorId')

  const auth = await (contributorId ? requireOwnerOrStaff(contributorId) : requireStaff())
  if (auth.response) return auth.response

  const where = {
    ...(contributorId && { contributorId }),
    ...(status && status !== 'all' && VALID_STATUSES.includes(status.toUpperCase()) && { status: status.toUpperCase() as 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' }),
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

const createPublicationSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  contributorId: z.string().min(1, 'contributorId is required'),
  category: z.string().trim().min(1, 'category is required'),
  language: z.string().optional(),
  coverImage: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
})

export const POST = withErrorHandling('/api/publications', 'POST', async (request: NextRequest) => {
  const parsed = createPublicationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.contributorId)
  if (auth.response) return auth.response

  const contributor = await prisma.user.findUnique({ where: { id: body.contributorId } })
  if (!contributor) throw new ApiError('The specified contributor does not exist', 400)

  const publication = await prisma.publication.create({
    data: {
      title: body.title,
      contributorId: body.contributorId,
      contributorName: contributor.name ?? `${contributor.firstName ?? ''} ${contributor.lastName ?? ''}`.trim(),
      category: body.category,
      language: (body.language ?? 'en').toUpperCase() as 'EN' | 'FR' | 'RW',
      coverImage: body.coverImage ?? null,
      description: body.description ?? '',
      status: body.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT',
    },
    include: REVENUE_INCLUDE,
  })

  if (publication.status === 'SUBMITTED') {
    const contributorName = publication.contributorName
    const publicationUrl = `${appBaseUrl()}/dashboard/publishing/review`
    await notifyUser({
      userId: body.contributorId,
      type: 'PUBLICATION',
      category: 'publication-submitted',
      title: 'Submission received',
      message: `Your submission "${publication.title}" has been received and is now awaiting review.`,
      href: '/dashboard/publishing',
      email: { subject: 'Your submission is under review', html: publicationSubmittedEmailHtml(contributorName, publication.title, publicationUrl) },
    })

    await notifyAllStaff({
      type: 'PUBLICATION',
      category: 'publication-submitted',
      title: 'New submission for review',
      message: `${contributorName} submitted "${publication.title}" for review.`,
      href: '/dashboard/publishing/review',
    })
  }

  return NextResponse.json({ data: serializePublication(publication), message: 'Publication created successfully', code: 'success', status: 201 }, { status: 201 })
})
