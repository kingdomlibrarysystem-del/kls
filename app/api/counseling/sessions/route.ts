import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/** Real CounselingSession API, modeled on /api/appointments + /api/borrowings' dual userId-present-vs-absent branching. */
function serializeSession(s: {
  id: string
  userId: string
  counselorId: string
  proposedTime: Date
  mode: string
  reason: string
  status: string
  counselor?: { name: string; specialty: string }
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: s.id,
    userId: s.userId,
    counselorId: s.counselorId,
    counselorName: s.counselor?.name,
    counselorSpecialty: s.counselor?.specialty,
    memberName: s.user ? (s.user.name ?? `${s.user.firstName ?? ''} ${s.user.lastName ?? ''}`.trim()) : undefined,
    proposedTime: s.proposedTime.toISOString(),
    mode: s.mode,
    reason: s.reason,
    status: s.status,
  }
}

const LIST_INCLUDE = { counselor: { select: { name: true, specialty: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const auth = await requireOwnerOrStaff(userId)
    if (auth.response) return auth.response

    const sessions = await prisma.counselingSession.findMany({
      where: { userId },
      include: LIST_INCLUDE,
      orderBy: { proposedTime: 'desc' },
    })

    return NextResponse.json({
      data: sessions.map(serializeSession),
      message: 'Counseling sessions fetched successfully',
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

  const [totalItems, sessions] = await Promise.all([
    prisma.counselingSession.count({ where }),
    prisma.counselingSession.findMany({
      where, include: LIST_INCLUDE, orderBy: { proposedTime: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: sessions.map(serializeSession),
    message: 'Counseling sessions fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const requestSessionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  counselorId: z.string().min(1, 'counselorId is required'),
  proposedTime: z.string().datetime(),
  mode: z.enum(['IN_PERSON', 'VIRTUAL']).default('IN_PERSON'),
  reason: z.string().trim().min(1, 'reason is required'),
})

export const POST = withErrorHandling('/api/counseling/sessions', 'POST', async (request: NextRequest) => {
  const parsed = requestSessionSchema.safeParse(await request.json())
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const [user, counselor] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.counselor.findUnique({ where: { id: body.counselorId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!counselor) throw new ApiError('The specified counselor does not exist', 400)

  const session = await prisma.counselingSession.create({
    data: {
      userId: body.userId,
      counselorId: body.counselorId,
      proposedTime: new Date(body.proposedTime),
      mode: body.mode,
      reason: body.reason,
      status: 'PENDING',
    },
    include: LIST_INCLUDE,
  })

  return NextResponse.json({ data: serializeSession(session), message: 'Session requested successfully', code: 'success', status: 201 }, { status: 201 })
})
