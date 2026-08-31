import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'
import { notifyUser } from '@/lib/notify'
import { reservationCreatedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

interface CreateReservationInput {
  userId: string
  resourceId: string
  memberName: string
  memberEmail: string
}

const RESERVATION_RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, totalQty: true, availableQty: true } } } as const

/**
 * The real Reservation-row creation logic — shared by POST
 * /api/reservations (free path, Settings.reservationFee === 0) and
 * settleAccessOrder (paid path, called once payment settles). Keeps the
 * atomic reservationQueueCounter increment as the sole source of queue
 * position for both callers rather than two independently maintained
 * copies of that concurrency-sensitive logic.
 */
export async function createReservationRecord(input: CreateReservationInput) {
  const [user, resource] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.resource.findUnique({ where: { id: input.resourceId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!resource) throw new ApiError('The specified resource does not exist', 400)

  const existing = await prisma.reservation.findFirst({
    where: { userId: input.userId, resourceId: input.resourceId, status: { in: ['PENDING', 'NOTIFIED'] } },
  })
  if (existing) {
    throw new ApiError('You already have an active reservation for this resource', 409)
  }

  const updatedResource = await prisma.resource.update({
    where: { id: input.resourceId },
    data: { reservationQueueCounter: { increment: 1 } },
    select: { reservationQueueCounter: true },
  })

  const reservation = await prisma.reservation.create({
    data: {
      userId: input.userId,
      memberName: input.memberName,
      memberEmail: input.memberEmail,
      resourceId: input.resourceId,
      queuePosition: updatedResource.reservationQueueCounter,
      status: 'PENDING',
    },
    include: RESERVATION_RESOURCE_INCLUDE,
  })

  const reservationUrl = `${appBaseUrl()}/member/reservations/${reservation.id}`
  await notifyUser({
    userId: input.userId,
    type: 'RESERVATION',
    category: 'reservation-created',
    title: 'Reservation placed',
    message: `Your reservation for "${reservation.resource.title}" has been placed.`,
    href: `/member/reservations/${reservation.id}`,
    email: { subject: 'Your reservation has been placed', html: reservationCreatedEmailHtml(input.memberName, reservation.resource.title, reservation.queuePosition, reservationUrl) },
  })

  return reservation
}
