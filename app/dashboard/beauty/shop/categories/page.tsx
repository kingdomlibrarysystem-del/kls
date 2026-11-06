import { PageHeader } from '@/components/ui/page-header'
import { NoPermission } from '@/components/app-shell/no-permission'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { listCategories } from '@/lib/shop/data'
import { SHOP_PERMISSION, type ShopCategory } from '@/lib/shop/shared'
import { toPlain } from '@/lib/server/to-plain'
import { CategoriesView, type ServiceChoice } from '../_components/categories-view'
import prisma from '@/prisma/client'

/** Shop categories (staff with "Manage Shop"): the filter chips members see in the shop, optionally linked to a service. */
export default async function ShopCategoriesPage() {
  await requireStaffPage()
  if (!(await pageHasPermission(SHOP_PERMISSION))) {
    return (<div><PageHeader title="Shop Categories" /><NoPermission permissionLabel="Manage Shop" /></div>)
  }
  // Categories and the service programmes they can be linked to, in parallel.
  const [categories, services] = await Promise.all([
    listCategories({ withCounts: true }),
    prisma.serviceProgram.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true, active: true } }),
  ])
  return (
    <div>
      <PageHeader title="Shop Categories" subtitle="Group products so members find them quickly" />
      <CategoriesView initialCategories={toPlain<ShopCategory[]>(categories)} services={toPlain<ServiceChoice[]>(services)} />
    </div>
  )
}
