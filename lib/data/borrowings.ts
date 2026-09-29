import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeBorrow(b: {
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

export const RESOURCE_INCLUDE = { resource: { select: { title: true, author: true, type: true, isbn: true, coverImages: true, category: { select: { nameEn: true } } } } } as const

/** One borrowing in the GET /api/borrowings/[id] shape, plus its owner id so the caller can apply the owner-or-staff check. */
export async function getBorrowingDetail(id: string) {
  if (!isObjectId(id)) return null
  const borrow = await prisma.borrow.findUnique({ where: { id }, include: RESOURCE_INCLUDE })
  return borrow ? { ownerId: borrow.userId, borrowing: serializeBorrow(borrow) } : null
}
