import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

function serializeAppointment(a: {
  id: string
  userId: string
  providerId: string
  serviceId: string
  dateTime: Date
  notes: string | null
  status: string
  provider?: { name: string }
  service?: { name: string; priceRwf: number }
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: a.id,
    userId: a.userId,
    providerId: a.providerId,
    providerName: a.provider?.name,
    serviceId: a.serviceId,
    serviceName: a.service?.name,
    priceRwf: a.service?.priceRwf,
    memberName: a.user ? (a.user.name ?? `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim()) : undefined,
    dateTime: a.dateTime.toISOString(),
    notes: a.notes,
    status: a.status,
  }
}

const DETAIL_INCLUDE = { provider: { select: { name: true } }, service: { select: { name: true, priceRwf: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appointment = await prisma.beautyAppointment.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  if (!appointment) {
    return NextResponse.json({ data: null, message: 'Appointment not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(appointment.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeAppointment(appointment), message: 'Appointment fetched successfully', code: 'success', status: 200 })
}

/** A member can cancel their own PENDING/CONFIRMED appointment; staff can additionally confirm/complete — same split as /api/appointments/[id]. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.beautyAppointment.findUnique({ where: { id } })
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

    const updated = await prisma.beautyAppointment.update({ where: { id }, data: { status: body.status }, include: DETAIL_INCLUDE })
    return NextResponse.json({ data: serializeAppointment(updated), message: 'Appointment updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update appointment', code: 'error', status: 500 }, { status: 500 })
  }
}
