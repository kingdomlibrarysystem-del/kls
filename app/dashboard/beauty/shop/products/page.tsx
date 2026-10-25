import { PageHeader } from '@/components/ui/page-header'
import { NoPermission } from '@/components/app-shell/no-permission'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { getShopOverview, getShopSettings, listAllProducts, listCategories } from '@/lib/shop/data'
import { SHOP_PERMISSION, type ShopCategory, type ShopProduct } from '@/lib/shop/shared'
import { toPlain } from '@/lib/server/to-plain'
import { ShopStats } from '../_components/shop-stats'
import { ProductsView } from '../_components/products-view'

/** Shop products (staff with "Manage Shop"). Everything is loaded on the server in parallel. */
export default async function ShopProductsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  await requireStaffPage()
  if (!(await pageHasPermission(SHOP_PERMISSION))) {
    return (<div><PageHeader title="Shop Products" /><NoPermission permissionLabel="Manage Shop" /></div>)
  }
  const [products, categories, overview, settings, sp] = await Promise.all([listAllProducts(), listCategories({ withCounts: true }), getShopOverview(), getShopSettings(), searchParams])
  return (
    <div>
      <PageHeader title="Shop Products" subtitle="Products members can buy — photos, price, stock and status" />
      <ShopStats overview={overview} />
      <ProductsView initialProducts={toPlain<ShopProduct[]>(products)} categories={toPlain<ShopCategory[]>(categories)} initialDeliveryFee={settings.deliveryFeeRwf} openNew={sp.new === "1"} />
    </div>
  )
}
