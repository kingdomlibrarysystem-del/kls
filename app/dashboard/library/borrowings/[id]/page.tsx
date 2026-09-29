import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getBorrowingDetail } from '@/lib/data/borrowings'
import { toPlain } from '@/lib/server/to-plain'
import { BorrowingDetailView } from './_components/borrowing-detail-view'
import type { Borrowing } from '../_components/borrowings-data'

interface BorrowingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BorrowingDetailPage({ params }: BorrowingDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getBorrowingDetail(id)
  if (!detail) notFound()
  return <BorrowingDetailView initialBorrowing={toPlain<Borrowing>(detail.borrowing)} />
}
