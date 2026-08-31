import prisma from '@/prisma/client'
import { ApiError } from '@/lib/api-error-handler'

interface CreateBorrowInput {
  userId: string
  resourceId: string
  memberName: string
  memberEmail: string
  borrowDate?: string
  dueDate?: string
}

const BORROW_RESOURCE_INCLUDE = { resource: { select: { title: true, type: true, isbn: true } } } as const

/**
 * The real Borrow-row creation logic — shared by POST /api/borrowings
 * (free path, Settings.borrowingFee === 0) and settleAccessOrder (paid
 * path, called once payment settles). Kept as a plain function rather
 * than only living inside the POST handler so both callers get the exact
 * same duplicate-guard/transaction semantics, not two independently
 * maintained copies.
 */
export async function createBorrowRecord(input: CreateBorrowInput) {
  const [user, resource] = await Promise.all([
    prisma.user.findUnique({ where: { id: input.userId } }),
    prisma.resource.findUnique({ where: { id: input.resourceId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!resource) throw new ApiError('The specified resource does not exist', 400)

  const borrowDate = input.borrowDate ? new Date(input.borrowDate) : new Date()
  let dueDate: Date
  if (input.dueDate) {
    dueDate = new Date(input.dueDate)
  } else {
    const settings = await prisma.settings.findFirst()
    const periodDays = settings?.defaultBorrowPeriodDays ?? 14
    dueDate = new Date(borrowDate.getTime() + periodDays * 86400000)
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.borrow.findFirst({
      where: { userId: input.userId, resourceId: input.resourceId, status: { in: ['PENDING', 'ACTIVE'] } },
    })
    if (existing) {
      throw new ApiError('You already have a pending or active borrow request for this resource', 409)
    }
    return tx.borrow.create({
      data: {
        userId: input.userId,
        memberName: input.memberName,
        memberEmail: input.memberEmail,
        resourceId: input.resourceId,
        borrowDate,
        dueDate,
        status: 'PENDING',
      },
      include: BORROW_RESOURCE_INCLUDE,
    })
  })
}
