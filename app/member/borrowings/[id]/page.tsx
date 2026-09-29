import { notFound } from 'next/navigation'
import { requirePageAuth, canAccessOwned } from '@/lib/server/page-session'
import { getBorrowingDetail } from '@/lib/data/borrowings'
import { toPlain } from '@/lib/server/to-plain'
import { BorrowingDetailView } from './_components/borrowing-detail-view'
import type { Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

interface BorrowingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BorrowingDetailPage({ params }: BorrowingDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, requirePageAuth()])
  const detail = await getBorrowingDetail(id)
  // Same owner-or-staff rule as GET /api/borrowings/[id]; someone else's record is a 404, not a 403.
  if (!detail || !canAccessOwned(session, detail.ownerId)) notFound()
  return <BorrowingDetailView initialBorrowing={toPlain<Borrowing>(detail.borrowing)} />
}
