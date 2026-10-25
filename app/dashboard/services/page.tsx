import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { NoPermission } from '@/components/app-shell/no-permission'
import { pageHasPermission, requireStaffPage } from '@/lib/server/page-session'
import { listAllServices } from '@/lib/services/data'
import { SERVICES_PERMISSION } from '@/lib/services/schemas'
import { toPlain } from '@/lib/server/to-plain'
import type { LifeAreaItem, ServiceProgramItem } from '@/lib/services/shared'
import { ServicesAdminView } from './_components/services-admin-view'

/** Staff: the service programmes and life areas shown on /services, the home page and the header menu. Server-loaded. */
export default async function ServicesAdminPage() {
  await requireStaffPage()
  if (!(await pageHasPermission(SERVICES_PERMISSION))) {
    return <PageTransition><PageHeader title="Services & Programs" /><NoPermission permissionLabel="Manage Services & Programs" /></PageTransition>
  }
  const { programs, areas } = await listAllServices()
  return (
    <PageTransition>
      <PageHeader title="Services & Programs" subtitle="What visitors see on the Services page, the home page and the header menu" />
      <ServicesAdminView initialPrograms={toPlain<ServiceProgramItem[]>(programs)} initialAreas={toPlain<LifeAreaItem[]>(areas)} />
    </PageTransition>
  )
}
