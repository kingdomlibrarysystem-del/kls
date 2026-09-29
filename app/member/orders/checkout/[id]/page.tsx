import { notFound } from 'next/navigation'
import { requirePageAuth, canAccessOwned } from '@/lib/server/page-session'
import { getCheckoutDetail } from '@/lib/data/checkouts'
import { toPlain } from '@/lib/server/to-plain'
import { CheckoutDetailView } from './_components/checkout-detail-view'
import type { MemberCheckout } from '../../_components/orders-data'

interface CheckoutDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CheckoutDetailPage({ params }: CheckoutDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, requirePageAuth()])
  const detail = await getCheckoutDetail(id)
  // Same owner-or-staff rule as GET /api/checkout/[id].
  if (!detail || !canAccessOwned(session, detail.ownerId)) notFound()
  return <CheckoutDetailView initialCheckout={toPlain<MemberCheckout>(detail.checkout)} />
}
