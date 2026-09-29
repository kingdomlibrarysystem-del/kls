import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeReview(r: { id: string; userId: string; rating: number; comment: string | null; createdAt: Date; updatedAt: Date; user: { firstName: string | null; lastName: string | null } }) {
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

/** A resource's reviews, newest first, in the GET /api/reviews?resourceId= shape. */
export async function getResourceReviews(resourceId: string) {
  if (!isObjectId(resourceId)) return []
  const reviews = await prisma.review.findMany({
    where: { resourceId },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return reviews.map(serializeReview)
}
