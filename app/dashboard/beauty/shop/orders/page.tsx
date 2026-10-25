import { PageHeader } from '@/components/ui/page-header'
import { NoPermission } from '@/components/app-shell/no-permission'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { getShopOverview, listOrders } from '@/lib/shop/data'
import { SHOP_PERMISSION, type ShopOrder } from '@/lib/shop/shared'
import { toPlain } from '@/lib/server/to-plain'
import { ShopStats } from '../_components/shop-stats'
import { OrdersView } from '../_components/orders-view'

/** Shop orders (staff with "Manage Shop"): prepare, mark ready / out for delivery / completed, or cancel. */
export default async function ShopOrdersPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  await requireStaffPage()
  if (!(await pageHasPermission(SHOP_PERMISSION))) {
    return (<div><PageHeader title="Shop Orders" /><NoPermission permissionLabel="Manage Shop" /></div>)
  }
  const [orders, overview, sp] = await Promise.all([listOrders(), getShopOverview(), searchParams])
  return (
    <div>
      <PageHeader title="Shop Orders" subtitle="Paid orders to prepare and hand over, and their payment status" />
      <ShopStats overview={overview} />
      <OrdersView initialOrders={toPlain<ShopOrder[]>(orders)} initialOpenId={sp.order} />
    </div>
  )
}
