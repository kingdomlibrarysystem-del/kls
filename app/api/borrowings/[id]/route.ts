import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyUser } from '@/lib/notify'
import { borrowApprovedEmailHtml, borrowRejectedEmailHtml, borrowReturnedEmailHtml } from '@/lib/email-templates'
import { appBaseUrl } from '@/lib/mailer'

function serializeBorrow(b: {
  id: string
  userId: string
  memberName: string
  memberEmail: string
  resourceId: string
  resource: { title: string; author: string; type: string; isbn: string; coverImages: string[]; category: { nameEn: string } | null }
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
    resourceAuthor: b.resource.author,
    resourceType: b.resource.type,
    resourceCover: b.resource.coverImages[0] ?? null,
    resourceCategory: b.resource.category?.nameEn ?? null,
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

const RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, isbn: true, coverImages: true, category: { select: { nameEn: true } } } } } as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const borrow = await prisma.borrow.findUnique({ where: { id }, include: RESOURCE_INCLUDE })
  if (!borrow) {
    return NextResponse.json({ data: null, message: 'Borrowing not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(borrow.userId)
  if (auth.response) return auth.response
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
])

export const PATCH = withErrorHandling('/api/borrowings/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

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
  } else {
    data.finePaid = true
  }

  const updated = await prisma.borrow.update({ where: { id }, data, include: RESOURCE_INCLUDE })

  const borrowUrl = `${appBaseUrl()}/member/borrowings/${updated.id}`
  if (body.action === 'approve') {
    await notifyUser({
      userId: updated.userId,
      type: 'BORROW',
      category: 'borrow-approved',
      title: 'Borrowing approved',
      message: `Your borrow request for "${updated.resource.title}" has been approved. Due back by ${updated.dueDate.toISOString().split('T')[0]}.`,
      href: `/member/borrowings/${updated.id}`,
      email: { subject: 'Your borrow request was approved', html: borrowApprovedEmailHtml(updated.memberName, updated.resource.title, updated.dueDate.toISOString().split('T')[0], borrowUrl) },
    })
  } else if (body.action === 'reject') {
    await notifyUser({
      userId: updated.userId,
      type: 'BORROW',
      category: 'borrow-rejected',
      title: 'Borrowing not approved',
      message: `Your borrow request for "${updated.resource.title}" was not approved.`,
      href: `/member/borrowings/${updated.id}`,
      email: { subject: 'Update on your borrow request', html: borrowRejectedEmailHtml(updated.memberName, updated.resource.title, borrowUrl) },
    })
  } else if (body.action === 'return') {
    await notifyUser({
      userId: updated.userId,
      type: 'BORROW',
      category: 'borrow-returned',
      title: 'Borrowing returned',
      message: `Thanks for returning "${updated.resource.title}".`,
      href: `/member/borrowings/${updated.id}`,
      email: { subject: 'Your return has been recorded', html: borrowReturnedEmailHtml(updated.memberName, updated.resource.title, updated.fineAmount, borrowUrl) },
    })
  }

  return NextResponse.json({ data: serializeBorrow(updated), message: 'Borrowing updated successfully', code: 'success', status: 200 })
})

export const DELETE = withErrorHandling('/api/borrowings/[id]', 'DELETE', async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const existing = await prisma.borrow.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Borrowing not found', 404)

  await prisma.borrow.delete({ where: { id } })
  return NextResponse.json({ data: null, message: 'Borrowing deleted successfully', code: 'success', status: 200 })
})
