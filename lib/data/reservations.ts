import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeReservation(r: {
  id: string
  userId: string
  memberName: string
  memberEmail: string
  resourceId: string
  resource: { title: string; author: string; type: string; totalQty: number; availableQty: number; coverImages: string[]; category: { nameEn: string } | null }
  queuePosition: number
  reservationDate: Date
  notifiedAt: Date | null
  claimDeadline: Date | null
  status: string
}) {
  return {
    id: r.id,
    memberId: r.userId,
    memberName: r.memberName,
    memberEmail: r.memberEmail,
    resourceId: r.resourceId,
    resourceTitle: r.resource.title,
    resourceAuthor: r.resource.author,
    resourceType: r.resource.type,
    resourceCover: r.resource.coverImages[0] ?? null,
    resourceCategory: r.resource.category?.nameEn ?? null,
    totalCopies: r.resource.totalQty,
    borrowedCopies: r.resource.totalQty - r.resource.availableQty,
    queuePosition: r.queuePosition,
    reservationDate: r.reservationDate.toISOString().split('T')[0],
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
    claimDeadline: r.claimDeadline ? r.claimDeadline.toISOString() : null,
    status: r.status.toLowerCase(),
  }
}

export const RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, totalQty: true, availableQty: true, coverImages: true, category: { select: { nameEn: true } } } } } as const

/** One reservation in the GET /api/reservations/[id] shape, plus its owner id so the caller can apply the owner-or-staff check. */
export async function getReservationDetail(id: string) {
  if (!isObjectId(id)) return null
  const reservation = await prisma.reservation.findUnique({ where: { id }, include: RESOURCE_INCLUDE })
  return reservation ? { ownerId: reservation.userId, reservation: serializeReservation(reservation) } : null
}
