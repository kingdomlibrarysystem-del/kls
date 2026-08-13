import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeAppointment(a: {
  id: string
  clinicId: string
  dateTime: Date
  reason: string
  status: string
}) {
  return {
    id: a.id,
    clinicId: a.clinicId,
    dateTime: a.dateTime.toISOString(),
    reason: a.reason,
    status: a.status,
  }
}

/** Cancels a PENDING or CONFIRMED appointment — the only state transition the member-facing UI performs. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (body.status !== 'CANCELLED') {
      return NextResponse.json({ data: null, message: "Only cancelling an appointment (status: 'CANCELLED') is supported here", code: 'error', status: 400 }, { status: 400 })
    }
    const existing = await prisma.appointment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Appointment not found', code: 'error', status: 404 }, { status: 404 })
    }
    const updated = await prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ data: serializeAppointment(updated), message: 'Appointment cancelled successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to cancel appointment', code: 'error', status: 500 }, { status: 500 })
  }
}
