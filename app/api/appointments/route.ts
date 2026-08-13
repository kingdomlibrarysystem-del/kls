import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real Appointment API, replacing health-data.ts's initialAppointments
 * (hardcoded to a single 'John Doe' persona, no real userId).
 */
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ data: null, message: 'userId is required', code: 'error', status: 400 }, { status: 400 })
  }

  const appointments = await prisma.appointment.findMany({
    where: { userId },
    orderBy: { dateTime: 'desc' },
  })

  return NextResponse.json({
    data: appointments.map(serializeAppointment),
    message: 'Appointments fetched successfully',
    code: 'success',
    status: 200,
  })
}

const bookAppointmentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  clinicId: z.string().min(1, 'clinicId is required'),
  dateTime: z.string().datetime(),
  reason: z.string().trim().min(1, 'reason is required'),
})

export const POST = withErrorHandling('/api/appointments', 'POST', async (request: NextRequest) => {
  const parsed = bookAppointmentSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const [user, clinic] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.clinic.findUnique({ where: { id: body.clinicId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!clinic) throw new ApiError('The specified clinic does not exist', 400)

  const appointment = await prisma.appointment.create({
    data: {
      userId: body.userId,
      clinicId: body.clinicId,
      dateTime: new Date(body.dateTime),
      reason: body.reason,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ data: serializeAppointment(appointment), message: 'Appointment requested successfully', code: 'success', status: 201 }, { status: 201 })
})
