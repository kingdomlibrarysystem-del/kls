import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/**
 * Real RehabSession API. GET backs both the member "Program Schedule"
 * view and the admin schedule list (userId-present-vs-absent, same
 * split as /api/borrowings). POST is staff-only — a rehab session is
 * staff-scheduled as part of a care plan, not self-booked by a member,
 * per the module's own "with staff support"/"facilitated by program
 * staff" hints — a deliberate divergence from Beauty/Counseling.
 */
function serializeSession(s: {
  id: string
  userId: string
  groupId: string | null
  facilitatorId: string | null
  dateTime: Date
  focus: string
  status: string
  group?: { name: string } | null
  facilitator?: { name: string | null; firstName: string | null; lastName: string | null } | null
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: s.id,
    userId: s.userId,
    memberName: s.user ? (s.user.name ?? `${s.user.firstName ?? ''} ${s.user.lastName ?? ''}`.trim()) : undefined,
    groupId: s.groupId,
    groupName: s.group?.name,
    facilitatorId: s.facilitatorId,
    facilitatorName: s.facilitator ? (s.facilitator.name ?? `${s.facilitator.firstName ?? ''} ${s.facilitator.lastName ?? ''}`.trim()) : undefined,
    dateTime: s.dateTime.toISOString(),
    focus: s.focus,
    status: s.status,
  }
}

const LIST_INCLUDE = {
  group: { select: { name: true } },
  facilitator: { select: { name: true, firstName: true, lastName: true } },
  user: { select: { name: true, firstName: true, lastName: true } },
} as const
const VALID_STATUSES = ['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const auth = await requireOwnerOrStaff(userId)
    if (auth.response) return auth.response

    const sessions = await prisma.rehabSession.findMany({
      where: { userId },
      include: LIST_INCLUDE,
      orderBy: { dateTime: 'desc' },
    })

    return NextResponse.json({ data: sessions.map(serializeSession), message: 'Sessions fetched successfully', code: 'success', status: 200 })
  }

  const auth = await requireStaff()
  if (auth.response) return auth.response

  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const status = searchParams.get('status')

  const where = {
    ...(status && status !== 'all' && VALID_STATUSES.includes(status) && { status: status as 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED' }),
  }

  const [totalItems, sessions] = await Promise.all([
    prisma.rehabSession.count({ where }),
    prisma.rehabSession.findMany({
      where, include: LIST_INCLUDE, orderBy: { dateTime: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: sessions.map(serializeSession),
    message: 'Sessions fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const scheduleSessionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  groupId: z.string().trim().optional(),
  facilitatorId: z.string().trim().optional(),
  dateTime: z.string().datetime(),
  focus: z.string().trim().min(1, 'focus is required'),
})

export const POST = withErrorHandling('/api/rehabilitation/schedule', 'POST', async (request: NextRequest) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const parsed = scheduleSessionSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const user = await prisma.user.findUnique({ where: { id: body.userId } })
  if (!user) throw new ApiError('The specified user does not exist', 400)

  const session = await prisma.rehabSession.create({
    data: {
      userId: body.userId,
      groupId: body.groupId || undefined,
      facilitatorId: body.facilitatorId || undefined,
      dateTime: new Date(body.dateTime),
      focus: body.focus,
      status: 'SCHEDULED',
    },
    include: LIST_INCLUDE,
  })

  return NextResponse.json({ data: serializeSession(session), message: 'Session scheduled successfully', code: 'success', status: 201 }, { status: 201 })
})
