import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/** Real BeautyAppointment API, modeled directly on /api/appointments + /api/borrowings' dual userId-present-vs-absent branching. */
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

const LIST_INCLUDE = { provider: { select: { name: true } }, service: { select: { name: true, priceRwf: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const auth = await requireOwnerOrStaff(userId)
    if (auth.response) return auth.response

    const appointments = await prisma.beautyAppointment.findMany({
      where: { userId },
      include: LIST_INCLUDE,
      orderBy: { dateTime: 'desc' },
    })

    return NextResponse.json({
      data: appointments.map(serializeAppointment),
      message: 'Beauty appointments fetched successfully',
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
    prisma.beautyAppointment.count({ where }),
    prisma.beautyAppointment.findMany({
      where, include: LIST_INCLUDE, orderBy: { dateTime: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: appointments.map(serializeAppointment),
    message: 'Beauty appointments fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const bookAppointmentSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  providerId: z.string().min(1, 'providerId is required'),
  serviceId: z.string().min(1, 'serviceId is required'),
  dateTime: z.string().datetime(),
  notes: z.string().trim().optional(),
})

export const POST = withErrorHandling('/api/beauty/appointments', 'POST', async (request: NextRequest) => {
  const parsed = bookAppointmentSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const [user, provider, service] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.beautyProvider.findUnique({ where: { id: body.providerId } }),
    prisma.beautyService.findUnique({ where: { id: body.serviceId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!provider) throw new ApiError('The specified provider does not exist', 400)
  if (!service) throw new ApiError('The specified service does not exist', 400)

  const appointment = await prisma.beautyAppointment.create({
    data: {
      userId: body.userId,
      providerId: body.providerId,
      serviceId: body.serviceId,
      dateTime: new Date(body.dateTime),
      notes: body.notes,
      status: 'PENDING',
    },
    include: LIST_INCLUDE,
  })

  return NextResponse.json({ data: serializeAppointment(appointment), message: 'Appointment requested successfully', code: 'success', status: 201 }, { status: 201 })
})
