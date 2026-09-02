import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

/** Real BeautyReview API — one review per completed appointment, recomputes BeautyProvider.avgRating/reviewCount on write, mirrors /api/reviews' exact recompute pattern. */
function serializeReview(r: { id: string; userId: string; providerId: string; appointmentId: string; rating: number; comment: string | null; createdAt: Date; user: { firstName: string | null; lastName: string | null } }) {
  return {
    id: r.id,
    userId: r.userId,
    userName: `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() || 'Member',
    providerId: r.providerId,
    appointmentId: r.appointmentId,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }
}

async function recomputeProviderRating(providerId: string) {
  const agg = await prisma.beautyReview.aggregate({ where: { providerId }, _avg: { rating: true }, _count: true })
  await prisma.beautyProvider.update({
    where: { id: providerId },
    data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get('providerId')
  if (!providerId) {
    return NextResponse.json({ data: null, message: 'providerId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const reviews = await prisma.beautyReview.findMany({
    where: { providerId },
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

const createReviewSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  appointmentId: z.string().min(1, 'appointmentId is required'),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(2000).optional(),
})

export const POST = withErrorHandling('/api/beauty/reviews', 'POST', async (request: NextRequest) => {
  const parsed = createReviewSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const appointment = await prisma.beautyAppointment.findUnique({ where: { id: body.appointmentId } })
  if (!appointment) throw new ApiError('Appointment not found', 404)
  if (appointment.userId !== body.userId) throw new ApiError('You can only review your own appointments', 403)
  if (appointment.status !== 'COMPLETED') throw new ApiError('Only a completed appointment can be reviewed', 409)

  const existing = await prisma.beautyReview.findUnique({ where: { appointmentId: body.appointmentId } })
  if (existing) throw new ApiError('This appointment has already been reviewed', 409)

  const review = await prisma.beautyReview.create({
    data: {
      userId: body.userId,
      providerId: appointment.providerId,
      appointmentId: body.appointmentId,
      rating: body.rating,
      comment: body.comment,
    },
    include: { user: { select: { firstName: true, lastName: true } } },
  })

  await recomputeProviderRating(appointment.providerId)

  return NextResponse.json({ data: serializeReview(review), message: 'Review submitted successfully', code: 'success', status: 201 }, { status: 201 })
})
