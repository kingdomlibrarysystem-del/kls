import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

const createReservationSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  memberName: z.string().trim().min(1, 'memberName is required'),
  memberEmail: z.string().trim().email('memberEmail must be a valid email'),
})

/**
 * Real Reservation API, replacing the two disconnected mock stores at
 * app/dashboard/reservations/_components/reservations-data.ts (admin —
 * its resourceId values like "res-3" were confirmed NOT to match any
 * real Resource.id) and app/member/reservations/_components/
 * reservations-data.ts (member). `resourceTitle`/`resourceAuthor`/
 * `resourceType`/`totalCopies`/`borrowedCopies` are all read live off the
 * joined Resource, not stored redundantly, since Resource.totalQty/
 * availableQty are the real source of truth for stock counts.
 */
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

const VALID_STATUSES = ['pending', 'notified', 'claimed', 'expired', 'cancelled']
const RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, totalQty: true, availableQty: true } } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const userId = searchParams.get('userId')
  const resourceId = searchParams.get('resourceId')
  const status = searchParams.get('status')

  const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
  if (auth.response) return auth.response

  const where = {
    ...(userId && { userId }),
    ...(resourceId && { resourceId }),
    ...(status && status !== 'all' && VALID_STATUSES.includes(status) && {
      status: status.toUpperCase() as 'PENDING' | 'NOTIFIED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED',
    }),
    ...(search && {
      OR: [
        { memberName: { contains: search, mode: 'insensitive' as const } },
        { memberEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, reservations] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: RESOURCE_INCLUDE,
      orderBy: { reservationDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: reservations.map(serializeReservation),
    message: 'Reservations fetched successfully',
    code: 'success',
    status: 200,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

/**
 * Creating a reservation places it at the back of the real queue for that
 * resource — assigned via Resource.reservationQueueCounter, an atomic
 * per-resource counter (see the increment call below for why a derived
 * count() is unsafe under concurrency). A reservation always lands as
 * PENDING here rather than auto-promoting to NOTIFIED — notifying is a
 * distinct admin action (see [id]/route.ts's `notify`), matching the
 * admin workflow's own explicit 4-step description.
 */
export const POST = withErrorHandling('/api/reservations', 'POST', async (request: NextRequest) => {
  const parsed = createReservationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const [user, resource] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId } }),
    prisma.resource.findUnique({ where: { id: body.resourceId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!resource) throw new ApiError('The specified resource does not exist', 400)

  const existing = await prisma.reservation.findFirst({
    where: { userId: body.userId, resourceId: body.resourceId, status: { in: ['PENDING', 'NOTIFIED'] } },
  })
  if (existing) {
    throw new ApiError('You already have an active reservation for this resource', 409)
  }

  /**
   * A plain count()-then-create() is a read-then-write race: two
   * concurrent reservations for the same resource could both read
   * queueAhead=0 and both land at queuePosition 1 — confirmed by a
   * failing concurrency test even when wrapped in $transaction, since
   * Prisma's MongoDB transactions don't serialize concurrent
   * transactions against each other the way a SQL SERIALIZABLE
   * transaction would. Resource.reservationQueueCounter is instead
   * incremented atomically (MongoDB guarantees single-document writes
   * are atomic, with or without a transaction) and the returned
   * post-increment value used directly as this reservation's queue
   * position — no read-then-decide step for two requests to race on.
   */
  const updatedResource = await prisma.resource.update({
    where: { id: body.resourceId },
    data: { reservationQueueCounter: { increment: 1 } },
    select: { reservationQueueCounter: true },
  })

  const reservation = await prisma.reservation.create({
    data: {
      userId: body.userId,
      memberName: body.memberName,
      memberEmail: body.memberEmail,
      resourceId: body.resourceId,
      queuePosition: updatedResource.reservationQueueCounter,
      status: 'PENDING',
    },
    include: RESOURCE_INCLUDE,
  })

  return NextResponse.json({ data: serializeReservation(reservation), message: 'Reservation created successfully', code: 'success', status: 201 }, { status: 201 })
})
