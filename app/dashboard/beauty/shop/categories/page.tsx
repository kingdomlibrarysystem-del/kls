import { PageHeader } from '@/components/ui/page-header'
import { NoPermission } from '@/components/app-shell/no-permission'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { listCategories } from '@/lib/shop/data'
import { SHOP_PERMISSION, type ShopCategory } from '@/lib/shop/shared'
import { toPlain } from '@/lib/server/to-plain'
import { CategoriesView } from '../_components/categories-view'

/** Shop categories (staff with "Manage Shop"): the filter chips members see in the shop. */
export default async function ShopCategoriesPage() {
  await requireStaffPage()
  if (!(await pageHasPermission(SHOP_PERMISSION))) {
    return (<div><PageHeader title="Shop Categories" /><NoPermission permissionLabel="Manage Shop" /></div>)
  }
  const categories = await listCategories({ withCounts: true })
  return (
    <div>
      <PageHeader title="Shop Categories" subtitle="Group products so members find them quickly" />
      <CategoriesView initialCategories={toPlain<ShopCategory[]>(categories)} />
    </div>
  )
}
