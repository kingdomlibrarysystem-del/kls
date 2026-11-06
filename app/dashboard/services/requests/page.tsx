import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { NoPermission } from '@/components/app-shell/no-permission'
import { pageHasPermission, requireStaffPage } from '@/lib/server/page-session'
import { listAllRequests, REQUESTS_PERMISSION } from '@/lib/services/requests'
import { toPlain } from '@/lib/server/to-plain'
import type { ServiceRequestItem } from '@/lib/services/shared'
import { RequestsAdminView } from './_components/requests-admin-view'

/** Staff with "Handle Service Requests" (Admin always): every request, newest first. ?open=<id> opens one. Server-loaded. */
export default async function ServiceRequestsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  await requireStaffPage()
  if (!(await pageHasPermission(REQUESTS_PERMISSION))) {
    return <PageTransition><PageHeader title="Service Requests" /><NoPermission permissionLabel="Handle Service Requests" /></PageTransition>
  }
  const [requests, sp] = await Promise.all([listAllRequests(), searchParams])
  return (
    <PageTransition>
      <PageHeader title="Service Requests" subtitle="Members asking for help — by phone call, messages or online meeting" />
      <RequestsAdminView initialRequests={toPlain<ServiceRequestItem[]>(requests)} initialOpenId={sp.open} />
    </PageTransition>
  )
}
