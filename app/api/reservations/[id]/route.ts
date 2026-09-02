import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { reservationReadyEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

function serializeReservation(r: {
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

const RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, totalQty: true, availableQty: true, coverImages: true, category: { select: { nameEn: true } } } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reservation = await prisma.reservation.findUnique({ where: { id }, include: RESOURCE_INCLUDE })
  if (!reservation) {
    return NextResponse.json({ data: null, message: 'Reservation not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(reservation.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeReservation(reservation), message: 'Reservation fetched successfully', code: 'success', status: 200 })
}

/**
 * Status-transition guard, porting the admin mock's notify/convert-to-
 * borrow/cancel/expire business rules
 * (app/dashboard/reservations/page.tsx's handleNotify/handleConvertToBorrow/
 * handleCancel/handleExpire) into the server. `cancel` additionally
 * re-numbers queuePosition for every remaining PENDING reservation on the
 * same resource, exactly matching the mock's own re-sort-by-queuePosition
 * logic in handleCancel.
 */
const patchReservationSchema = z.union([
  z.object({ action: z.literal('notify') }),
  z.object({ action: z.literal('convertToBorrow') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('expire') }),
  z.object({ action: z.undefined() }).passthrough(),
])

/**
 * Status-transition guard, porting the admin mock's notify/convert-to-
 * borrow/cancel/expire business rules
 * (app/dashboard/reservations/page.tsx's handleNotify/handleConvertToBorrow/
 * handleCancel/handleExpire) into the server. `cancel` additionally
 * re-numbers queuePosition for every remaining PENDING reservation on the
 * same resource, exactly matching the mock's own re-sort-by-queuePosition
 * logic in handleCancel.
 */
export const PATCH = withErrorHandling('/api/reservations/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchReservationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.reservation.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Reservation not found', 404)

  if (body.action === 'notify') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending reservation can be notified', 409)
    const notifiedAt = new Date()
    const claimDeadline = new Date(notifiedAt.getTime() + 48 * 3600000)
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'NOTIFIED', notifiedAt, claimDeadline },
      include: RESOURCE_INCLUDE,
    })

    const reservationUrl = `${appBaseUrl()}/member/reservations/${updated.id}`
    await notifyUser({
      userId: updated.userId,
      type: 'RESERVATION',
      category: 'reservation-ready',
      title: 'Your reservation is ready',
      message: `"${updated.resource.title}" is ready for you to claim.`,
      href: `/member/reservations/${updated.id}`,
      email: { subject: 'Your reserved book is ready', html: reservationReadyEmailHtml(updated.memberName, updated.resource.title, claimDeadline.toLocaleString(), reservationUrl) },
    })

    return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
  }

  if (body.action === 'convertToBorrow') {
    if (existing.status !== 'NOTIFIED') throw new ApiError('Only a notified reservation can be converted to a borrow', 409)
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'CLAIMED' },
      include: RESOURCE_INCLUDE,
    })
    return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
  }

  if (body.action === 'cancel') {
    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED', claimDeadline: null },
        include: RESOURCE_INCLUDE,
      })
      const remaining = await tx.reservation.findMany({
        where: { resourceId: existing.resourceId, status: 'PENDING', id: { not: id } },
        orderBy: { queuePosition: 'asc' },
      })
      await Promise.all(remaining.map((r, idx) => tx.reservation.update({ where: { id: r.id }, data: { queuePosition: idx + 1 } })))
      return cancelled
    })
    return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
  }

  if (body.action === 'expire') {
    if (existing.status !== 'NOTIFIED') throw new ApiError('Only a notified reservation can expire', 409)
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'EXPIRED' },
      include: RESOURCE_INCLUDE,
    })
    return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
  }

  const data: Record<string, unknown> = { ...body }
  delete data.action
  const updated = await prisma.reservation.update({ where: { id }, data, include: RESOURCE_INCLUDE })
  return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/reservations/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.reservation.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Reservation not found', 404)

  await prisma.reservation.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Reservation deleted successfully', code: 'success', status: 200 })
})
