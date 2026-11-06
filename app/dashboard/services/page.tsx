import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { NoPermission } from '@/components/app-shell/no-permission'
import { pageHasPermission, requireStaffPage } from '@/lib/server/page-session'
import { listAllServices } from '@/lib/services/data'
import { SERVICES_PERMISSION } from '@/lib/services/schemas'
import { toPlain } from '@/lib/server/to-plain'
import type { LifeAreaItem, ServiceProgramItem } from '@/lib/services/shared'
import type { ShopProduct } from '@/lib/shop/shared'
import { listAllProducts, listCategories } from '@/lib/shop/data'
import type { ShopCategory } from '@/lib/shop/shared'
import prisma from '@/prisma/client'
import { ServicesAdminView } from './_components/services-admin-view'

/** Staff: the service programmes and life areas shown on /services, the home page and the header menu. Server-loaded. */
export default async function ServicesAdminPage() {
  await requireStaffPage()
  if (!(await pageHasPermission(SERVICES_PERMISSION))) {
    return <PageTransition><PageHeader title="Services & Programs" /><NoPermission permissionLabel="Manage Services & Programs" /></PageTransition>
  }
  // Catalogue, linkable shop products (not in Trash) and the open-request count, in parallel.
  const [{ programs, areas }, products, openRequests, categories] = await Promise.all([
    listAllServices(),
    listAllProducts().then((list) => list.filter((p) => !p.inTrash)),
    prisma.serviceRequest.count({ where: { status: { in: ['PENDING', 'SCHEDULED'] } } }),
    listCategories({ withCounts: true }),
  ])
  return (
    <PageTransition>
      <PageHeader title="Services & Programs" subtitle="Programmes, the sub-services members can request, and the life areas" />
      <ServicesAdminView initialPrograms={toPlain<ServiceProgramItem[]>(programs)} initialAreas={toPlain<LifeAreaItem[]>(areas)} products={toPlain<ShopProduct[]>(products)} openRequests={openRequests} categories={toPlain<ShopCategory[]>(categories)} />
    </PageTransition>
  )
}
