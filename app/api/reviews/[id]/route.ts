import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function recomputeResourceRating(resourceId: string) {
  const agg = await prisma.review.aggregate({ where: { resourceId }, _avg: { rating: true }, _count: true })
  await prisma.resource.update({
    where: { id: resourceId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  })
}

/** Deletes the caller's own review (or staff acting on their behalf). Recomputes Resource.avgRating/reviewCount immediately after. */
export const DELETE = withErrorHandling('/api/reviews/[id]', 'DELETE', async (_request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) throw new ApiError('Review not found', 404)

  const auth = await requireOwnerOrStaff(review.userId)
  if (auth.response) return auth.response

  await prisma.review.delete({ where: { id } })
  await recomputeResourceRating(review.resourceId)

  return NextResponse.json({ data: null, message: 'Review deleted successfully', code: 'success', status: 200 })
})
