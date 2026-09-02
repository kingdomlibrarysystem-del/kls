import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/**
 * Real Appointment API, replacing health-data.ts's initialAppointments
 * (hardcoded to a single 'John Doe' persona, no real userId).
 */
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

const LIST_INCLUDE = { clinic: { select: { name: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

/**
 * With ?userId=, returns that member's own appointments (owner-or-staff),
 * unpaginated — the existing member-facing shape, unchanged. Without it,
 * returns a paginated admin-wide list (staff only) for the new admin
 * oversight page — mirrors /api/borrowings' own userId-present-vs-absent
 * branching exactly.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const auth = await requireOwnerOrStaff(userId)
    if (auth.response) return auth.response

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: LIST_INCLUDE,
      orderBy: { dateTime: 'desc' },
    })

    return NextResponse.json({
      data: appointments.map(serializeAppointment),
      message: 'Appointments fetched successfully',
      code: 'success',
      status: 200,
    })
  }

  const auth = await requireStaff()
  if (auth.response) return auth.response

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const status = searchParams.get('status')

  const where = {
    ...(status && status !== 'all' && VALID_STATUSES.includes(status) && { status: status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }),
  }

  const [totalItems, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where, include: LIST_INCLUDE, orderBy: { dateTime: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: appointments.map(serializeAppointment),
    message: 'Appointments fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
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

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

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
