import { notFound } from 'next/navigation'
import { requirePageAuth, canAccessOwned } from '@/lib/server/page-session'
import { getOrderDetail } from '@/lib/data/orders'
import { toPlain } from '@/lib/server/to-plain'
import { OrderDetailView } from './_components/order-detail-view'
import type { MemberOrder } from '../_components/orders-data'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, requirePageAuth()])
  const detail = await getOrderDetail(id)
  // Same owner-or-staff rule as GET /api/orders/[id].
  if (!detail || !canAccessOwned(session, detail.ownerId)) notFound()
  return <OrderDetailView initialOrder={toPlain<MemberOrder>(detail.order)} />
}
