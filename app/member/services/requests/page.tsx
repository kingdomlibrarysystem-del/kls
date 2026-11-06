import { requirePageAuth } from '@/lib/server/page-session'
import { listMemberRequests } from '@/lib/services/requests'
import { toPlain } from '@/lib/server/to-plain'
import type { ServiceRequestItem } from '@/lib/services/shared'
import { MyRequestsView } from './_components/my-requests-view'

/** The member's service requests (server-loaded). */
export default async function MyServiceRequestsPage() {
  const session = await requirePageAuth()
  const requests = await listMemberRequests(session.userId)
  return <MyRequestsView initialRequests={toPlain<ServiceRequestItem[]>(requests)} />
}
