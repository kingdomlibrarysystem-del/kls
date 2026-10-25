import { notFound } from 'next/navigation'
import { requirePageAuth } from '@/lib/server/page-session'
import { getOrder } from '@/lib/shop/data'
import { toPlain } from '@/lib/server/to-plain'
import type { ShopOrder } from '@/lib/shop/shared'
import { ShopHeader } from '@/components/shop/shop-header'
import { OrderDetailView } from './_components/order-detail-view'

/** One of the member's orders: progress, items, payment (with automatic payment check while pending). */
export default async function ShopOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string; paid?: string }> }) {
  const session = await requirePageAuth()
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const order = await getOrder(id)
  if (!order || order.userId !== session.userId) notFound()
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <ShopHeader title="Order details" compact showCart />
      <OrderDetailView initialOrder={toPlain<ShopOrder>(order)} justPlaced={sp.placed === '1'} returnedFromCard={sp.paid === '1'} />
    </div>
  )
}
