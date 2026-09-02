import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

function serializeAppointment(a: {
  id: string
  userId: string
  clinicId: string
  dateTime: Date
  reason: string
  status: string
  clinic?: { name: string }
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: a.id,
    userId: a.userId,
    clinicId: a.clinicId,
    clinicName: a.clinic?.name,
    memberName: a.user ? (a.user.name ?? `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim()) : undefined,
    dateTime: a.dateTime.toISOString(),
    reason: a.reason,
    status: a.status,
  }
}

const DETAIL_INCLUDE = { clinic: { select: { name: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  if (!appointment) {
    return NextResponse.json({ data: null, message: 'Appointment not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(appointment.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeAppointment(appointment), message: 'Appointment fetched successfully', code: 'success', status: 200 })
}

/**
 * A member can only cancel their own PENDING/CONFIRMED appointment (the
 * original, still-supported transition). Staff can additionally confirm a
 * PENDING appointment or mark a CONFIRMED one COMPLETED — previously
 * impossible even for an admin, since this route hard-rejected any status
 * other than CANCELLED. Kept as one handler (not a separate admin route)
 * since both paths share the same lookup/serialize logic and differ only
 * in which status values + which auth guard apply.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Appointment not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.status === 'CANCELLED') {
      const auth = await requireOwnerOrStaff(existing.userId)
      if (auth.response) return auth.response
    } else if (body.status === 'CONFIRMED' || body.status === 'COMPLETED') {
      const auth = await requireStaff()
      if (auth.response) return auth.response
    } else {
      return NextResponse.json({ data: null, message: "status must be one of 'CONFIRMED', 'COMPLETED', 'CANCELLED'", code: 'error', status: 400 }, { status: 400 })
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status: body.status }, include: DETAIL_INCLUDE })
    return NextResponse.json({ data: serializeAppointment(updated), message: 'Appointment updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update appointment', code: 'error', status: 500 }, { status: 500 })
  }
}
