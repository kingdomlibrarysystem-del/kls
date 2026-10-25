import { PageHeader } from '@/components/ui/page-header'
import { requireStaffPage } from '@/lib/server/page-session'
import { listAllResources, type CareResourceItem } from '@/lib/care/data'
import { toPlain } from '@/lib/server/to-plain'
import { CareResourcesView } from './_components/care-resources-view'

/** Staff: readings, audio and video members see in Care & Support → Read & listen. Server-loaded. */
export default async function CareResourcesAdminPage() {
  await requireStaffPage()
  const resources = await listAllResources()
  return (
    <div>
      <PageHeader title="Care Resources" subtitle="Readings, audio and video for counseling and recovery" />
      <CareResourcesView initialResources={toPlain<CareResourceItem[]>(resources)} />
    </div>
  )
}
