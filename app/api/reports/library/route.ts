import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireStaff } from '@/lib/auth/require-role'

/**
 * Real Library Reports API, replacing
 * app/dashboard/library/reports/_components/reports-data.ts's three
 * hand-typed arrays (overdueList, topResources, fineCollection) with
 * live aggregate queries over the real Borrow collection (Phase 3) —
 * per the migration plan's own principle for this phase: convert
 * hand-typed report rows into real derivation now that the underlying
 * collections are real, following the pattern
 * app/dashboard/reports/_components/cross-module-data.ts already
 * modeled correctly for its own module.
 */
export async function GET() {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const [overdueBorrows, allBorrows, finedBorrows] = await Promise.all([
    prisma.borrow.findMany({
      where: { status: 'OVERDUE' },
      include: { resource: { select: { title: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.borrow.findMany({
      include: { resource: { select: { title: true, category: { select: { nameEn: true } } } } },
    }),
    prisma.borrow.findMany({
      where: { fineAmount: { not: null } },
      include: { resource: { select: { title: true } } },
      orderBy: { fineAmount: 'desc' },
    }),
  ])

  const now = Date.now()
  const overdueList = overdueBorrows.map((b) => ({
    id: b.id,
    memberName: b.memberName,
    resourceTitle: b.resource.title,
    dueDate: b.dueDate.toISOString().split('T')[0],
    daysOverdue: Math.max(0, Math.floor((now - b.dueDate.getTime()) / 86400000)),
  }))

  const borrowCountByResource = new Map()
  for (const b of allBorrows) {
    const key = b.resourceId
    const existing = borrowCountByResource.get(key)
    if (existing) {
      existing.borrowCount += 1
    } else {
      borrowCountByResource.set(key, {
        id: key,
        title: b.resource.title,
        category: b.resource.category?.nameEn ?? 'Uncategorized',
        borrowCount: 1,
      })
    }
  }
  const topResources = [...borrowCountByResource.values()].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 10)

  // Real Borrow.finePaid is a single boolean — it doesn't distinguish "paid
  // by the member" from "waived by an admin" the way the mock's 3-state
  // FineStatus (UNPAID/PAID/WAIVED) did. Reporting the real 2-state fact
  // rather than fabricating a WAIVED distinction the schema can't actually
  // tell apart.
  const fineCollection = finedBorrows.map((b) => ({
    id: b.id,
    memberName: b.memberName,
    resourceTitle: b.resource.title,
    daysOverdue: b.status === 'OVERDUE' ? Math.max(0, Math.floor((now - b.dueDate.getTime()) / 86400000)) : Math.max(0, Math.floor(((b.returnDate?.getTime() ?? now) - b.dueDate.getTime()) / 86400000)),
    amount: b.fineAmount,
    status: b.finePaid ? 'PAID' : 'UNPAID',
  }))

  return NextResponse.json({
    data: { overdueList, topResources, fineCollection },
    message: 'Library reports fetched successfully',
    code: 'success',
    status: 200,
  })
}
