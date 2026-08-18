import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

const createBorrowSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  memberName: z.string().trim().min(1, 'memberName is required'),
  memberEmail: z.string().trim().email('memberEmail must be a valid email'),
  borrowDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
})

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

  // With a userId, this is "my borrowings" (member) — ownership check. With
  // none, it's the admin dashboard's full list across every member — staff only.
  const auth = await (userId ? requireOwnerOrStaff(userId) : requireStaff())
  if (auth.response) return auth.response

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

export const POST = withErrorHandling('/api/borrowings', 'POST', async (request: NextRequest) => {
  const parsed = createBorrowSchema.safeParse(await request.json())
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

  const borrowDate = body.borrowDate ? new Date(body.borrowDate) : new Date()
  let dueDate: Date
  if (body.dueDate) {
    dueDate = new Date(body.dueDate)
  } else {
    const settings = await prisma.settings.findFirst()
    const periodDays = settings?.defaultBorrowPeriodDays ?? 14
    dueDate = new Date(borrowDate.getTime() + periodDays * 86400000)
  }

  /**
   * Guards against a double-submitted borrow request (e.g. a doubled
   * click or a retried request) creating two PENDING/ACTIVE rows for
   * the same user+resource. The existence check and the create run
   * inside one transaction so two near-simultaneous requests can't
   * both pass the check before either has committed its create.
   */
  const borrow = await prisma.$transaction(async (tx) => {
    const existing = await tx.borrow.findFirst({
      where: { userId: body.userId, resourceId: body.resourceId, status: { in: ['PENDING', 'ACTIVE'] } },
    })
    if (existing) {
      throw new ApiError('You already have a pending or active borrow request for this resource', 409)
    }
    return tx.borrow.create({
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
  })

  return NextResponse.json({ data: serializeBorrow(borrow), message: 'Borrowing created successfully', code: 'success', status: 201 }, { status: 201 })
})
