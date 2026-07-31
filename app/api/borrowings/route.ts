import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Borrow API, replacing the previous 2-row placeholder (which used a
 * different vocabulary — `daysLeft`, no memberName/memberEmail/isbn — than
 * this app's real Borrowing shape) and the mock stores at
 * app/dashboard/library/borrowings/_components/borrowings-data.ts (admin)
 * and app/member/borrowings/_components/borrowings-data.ts (member). One
 * real collection, real userId/resourceId FKs. `resourceTitle`/
 * `resourceType`/`isbn` are read off the joined Resource, not stored
 * redundantly, since Resource is now the real source of truth for them.
 */
function serializeBorrow(b: {
  id: string
  userId: string
  memberName: string
  memberEmail: string
  resourceId: string
  resource: { title: string; type: string; isbn: string }
  borrowDate: Date
  dueDate: Date
  returnDate: Date | null
  status: string
  renewalCount: number
  fineAmount: number | null
  finePaid: boolean
}) {
  return {
    id: b.id,
    memberId: b.userId,
    memberName: b.memberName,
    memberEmail: b.memberEmail,
    resourceId: b.resourceId,
    resourceTitle: b.resource.title,
    resourceType: b.resource.type,
    isbn: b.resource.isbn,
    borrowDate: b.borrowDate.toISOString().split('T')[0],
    dueDate: b.dueDate.toISOString().split('T')[0],
    returnDate: b.returnDate ? b.returnDate.toISOString().split('T')[0] : null,
    status: b.status.toLowerCase(),
    renewalCount: b.renewalCount,
    fineAmount: b.fineAmount,
    finePaid: b.finePaid,
  }
}

const VALID_STATUSES = ['pending', 'active', 'overdue', 'returned', 'rejected']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const search = searchParams.get('search')?.toLowerCase()
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')

  const where = {
    ...(userId && { userId }),
    ...(status && status !== 'all' && VALID_STATUSES.includes(status) && {
      status: status.toUpperCase() as 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'REJECTED',
    }),
    ...(search && {
      OR: [
        { memberName: { contains: search, mode: 'insensitive' as const } },
        { memberEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [totalItems, borrows] = await Promise.all([
    prisma.borrow.count({ where }),
    prisma.borrow.findMany({
      where,
      include: { resource: { select: { title: true, type: true, isbn: true } } },
      orderBy: { borrowDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  return NextResponse.json({
    data: borrows.map(serializeBorrow),
    message: 'Borrowings fetched successfully',
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

    const borrowDate = body.borrowDate ? new Date(body.borrowDate) : new Date()
    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(borrowDate.getTime() + 14 * 86400000)

    const borrow = await prisma.borrow.create({
      data: {
        userId: body.userId,
        memberName: body.memberName,
        memberEmail: body.memberEmail,
        resourceId: body.resourceId,
        borrowDate,
        dueDate,
        status: 'PENDING',
      },
      include: { resource: { select: { title: true, type: true, isbn: true } } },
    })

    return NextResponse.json({ data: serializeBorrow(borrow), message: 'Borrowing created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create borrowing', code: 'error', status: 500 }, { status: 500 })
  }
}
