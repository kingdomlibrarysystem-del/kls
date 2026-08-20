import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

function serializeReview(r: { id: string; userId: string; rating: number; comment: string | null; createdAt: Date; updatedAt: Date; user: { firstName: string | null; lastName: string | null } }) {
  return {
    id: r.id,
    userId: r.userId,
    userName: `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || 'Member',
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

/** Recomputes and persists Resource.avgRating/reviewCount from real Review rows — called after every create/update/delete so the denormalized fields never drift from the source of truth. */
async function recomputeResourceRating(resourceId: string) {
  const agg = await prisma.review.aggregate({ where: { resourceId }, _avg: { rating: true }, _count: true })
  await prisma.resource.update({
    where: { id: resourceId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resourceId = searchParams.get('resourceId')
  if (!resourceId) throw new ApiError('resourceId is required', 400)

  const reviews = await prisma.review.findMany({
    where: { resourceId },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    data: reviews.map(serializeReview),
    message: 'Reviews fetched successfully',
    code: 'success',
    status: 200,
  })
}

const upsertReviewSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(2000).optional(),
})

/**
 * Creates or updates the caller's own review for a resource — one real
 * review per user per resource (Review.@@unique([userId, resourceId])),
 * editable rather than allowing duplicates. Recomputes
 * Resource.avgRating/reviewCount immediately after the write.
 */
export const POST = withErrorHandling('/api/reviews', 'POST', async (request: NextRequest) => {
  const parsed = upsertReviewSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const resource = await prisma.resource.findUnique({ where: { id: body.resourceId } })
  if (!resource) throw new ApiError('Resource not found', 404)

  const review = await prisma.review.upsert({
    where: { userId_resourceId: { userId: body.userId, resourceId: body.resourceId } },
    update: { rating: body.rating, comment: body.comment },
    create: { userId: body.userId, resourceId: body.resourceId, rating: body.rating, comment: body.comment },
    include: { user: { select: { firstName: true, lastName: true } } },
  })

  await recomputeResourceRating(body.resourceId)

  return NextResponse.json(
    { data: serializeReview(review), message: 'Review saved successfully', code: 'success', status: 201 },
    { status: 201 }
  )
})
