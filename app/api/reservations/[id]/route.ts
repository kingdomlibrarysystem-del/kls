import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeReservation(r: {
  id: string
  userId: string
  memberName: string
  memberEmail: string
  resourceId: string
  resource: { title: string; author: string; type: string; totalQty: number; availableQty: number }
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
    totalCopies: r.resource.totalQty,
    borrowedCopies: r.resource.totalQty - r.resource.availableQty,
    queuePosition: r.queuePosition,
    reservationDate: r.reservationDate.toISOString().split('T')[0],
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
    claimDeadline: r.claimDeadline ? r.claimDeadline.toISOString() : null,
    status: r.status.toLowerCase(),
  }
}

const RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, totalQty: true, availableQty: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reservation = await prisma.reservation.findUnique({ where: { id }, include: RESOURCE_INCLUDE })
  if (!reservation) {
    return NextResponse.json({ data: null, message: 'Reservation not found', code: 'error', status: 404 }, { status: 404 })
  }
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.reservation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Reservation not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.action === 'notify') {
      if (existing.status !== 'PENDING') {
        return NextResponse.json({ data: null, message: 'Only a pending reservation can be notified', code: 'error', status: 409 }, { status: 409 })
      }
      const notifiedAt = new Date()
      const claimDeadline = new Date(notifiedAt.getTime() + 48 * 3600000)
      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: 'NOTIFIED', notifiedAt, claimDeadline },
        include: RESOURCE_INCLUDE,
      })
      return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
    }

    if (body.action === 'convertToBorrow') {
      if (existing.status !== 'NOTIFIED') {
        return NextResponse.json({ data: null, message: 'Only a notified reservation can be converted to a borrow', code: 'error', status: 409 }, { status: 409 })
      }
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
      if (existing.status !== 'NOTIFIED') {
        return NextResponse.json({ data: null, message: 'Only a notified reservation can expire', code: 'error', status: 409 }, { status: 409 })
      }
      const updated = await prisma.reservation.update({
        where: { id },
        data: { status: 'EXPIRED' },
        include: RESOURCE_INCLUDE,
      })
      return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
    }

    const data: Record<string, unknown> = { ...body }
    delete data.action
    delete data.id
    delete data.userId
    delete data.resourceId
    const updated = await prisma.reservation.update({ where: { id }, data, include: RESOURCE_INCLUDE })
    return NextResponse.json({ data: serializeReservation(updated), message: 'Reservation updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update reservation', code: 'error', status: 500 }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.reservation.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ data: null, message: 'Reservation not found', code: 'error', status: 404 }, { status: 404 })
  }
  await prisma.reservation.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Reservation deleted successfully', code: 'success', status: 200 })
}
