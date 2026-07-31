import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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
 * resource — computed as a live count of PENDING reservations for the same
 * resourceId, porting the logic from
 * app/member/_shared/use-reservations.ts's addReservation (queueAhead =
 * count of same-title Waiting/Ready reservations). A queue position of 0
 * (no one ahead) still lands as PENDING here rather than auto-promoting to
 * NOTIFIED — notifying is a distinct admin action (see [id]/route.ts's
 * `notify`), matching the admin workflow's own explicit 4-step description.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.userId || !body.resourceId || !body.memberName || !body.memberEmail) {
      return NextResponse.json({ data: null, message: 'Missing required fields: userId, resourceId, memberName, memberEmail', code: 'error', status: 400 }, { status: 400 })
    }

    const [user, resource] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.userId } }),
      prisma.resource.findUnique({ where: { id: body.resourceId } }),
    ])
    if (!user) {
      return NextResponse.json({ data: null, message: 'The specified user does not exist', code: 'error', status: 400 }, { status: 400 })
    }
    if (!resource) {
      return NextResponse.json({ data: null, message: 'The specified resource does not exist', code: 'error', status: 400 }, { status: 400 })
    }

    const queueAhead = await prisma.reservation.count({
      where: { resourceId: body.resourceId, status: { in: ['PENDING', 'NOTIFIED'] } },
    })

    const reservation = await prisma.reservation.create({
      data: {
        userId: body.userId,
        memberName: body.memberName,
        memberEmail: body.memberEmail,
        resourceId: body.resourceId,
        queuePosition: queueAhead + 1,
        status: 'PENDING',
      },
      include: RESOURCE_INCLUDE,
    })

    return NextResponse.json({ data: serializeReservation(reservation), message: 'Reservation created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create reservation', code: 'error', status: 500 }, { status: 500 })
  }
}
