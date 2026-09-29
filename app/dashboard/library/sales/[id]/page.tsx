import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getOrderDetail } from '@/lib/data/orders'
import { toPlain } from '@/lib/server/to-plain'
import { TransactionDetailView, type OrderDetail } from './_components/transaction-detail-view'

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getOrderDetail(id)
  if (!detail) notFound()
  return <TransactionDetailView initialOrder={toPlain<OrderDetail>(detail.order)} />
}
