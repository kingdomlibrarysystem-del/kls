import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

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

const RESOURCE_INCLUDE = { resource: { select: { title: true, type: true, isbn: true } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const borrow = await prisma.borrow.findUnique({ where: { id }, include: RESOURCE_INCLUDE })
  if (!borrow) {
    return NextResponse.json({ data: null, message: 'Borrowing not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeBorrow(borrow), message: 'Borrowing fetched successfully', code: 'success', status: 200 })
}

/**
 * Status-transition guard, porting the admin mock's approve/reject/
 * return/waive-fine business rules
 * (app/dashboard/library/borrowings/page.tsx's handleApprove/handleReject/
 * handleReturn/handleWaiveFine) into the server, rather than trusting the
 * client to only ever send valid transitions.
 */
const patchBorrowSchema = z.union([
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject') }),
  z.object({ action: z.literal('return') }),
  z.object({ action: z.literal('waiveFine') }),
  z.object({ action: z.undefined() }).passthrough(),
])

export const PATCH = withErrorHandling('/api/borrowings/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = patchBorrowSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.borrow.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Borrowing not found', 404)

  const data: Record<string, unknown> = {}

  if (body.action === 'approve') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending borrowing can be approved', 409)
    data.status = 'ACTIVE'
  } else if (body.action === 'reject') {
    if (existing.status !== 'PENDING') throw new ApiError('Only a pending borrowing can be rejected', 409)
    data.status = 'REJECTED'
  } else if (body.action === 'return') {
    if (existing.status !== 'ACTIVE' && existing.status !== 'OVERDUE') throw new ApiError('Only an active or overdue borrowing can be returned', 409)
    const now = new Date()
    data.status = 'RETURNED'
    data.returnDate = now
    data.fineAmount = existing.status === 'OVERDUE'
      ? Math.max(0, Math.floor((now.getTime() - existing.dueDate.getTime()) / 86400000)) * 200
      : null
  } else if (body.action === 'waiveFine') {
    data.finePaid = true
  } else {
    const rest = { ...body } as Record<string, unknown>
    delete rest.action
    Object.assign(data, rest)
  }

  const updated = await prisma.borrow.update({ where: { id }, data, include: RESOURCE_INCLUDE })
  return NextResponse.json({ data: serializeBorrow(updated), message: 'Borrowing updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/borrowings/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const existing = await prisma.borrow.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Borrowing not found', 404)

  await prisma.borrow.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Borrowing deleted successfully', code: 'success', status: 200 })
})
