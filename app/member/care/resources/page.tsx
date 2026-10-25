import { requirePageAuth } from '@/lib/server/page-session'
import { listPublishedResources, type CareResourceItem } from '@/lib/care/data'
import { toPlain } from '@/lib/server/to-plain'
import { ResourcesBrowser } from '../_components/resources-browser'

/** Readings, audio and video for wellbeing and recovery (server-loaded; filters run instantly in the browser). */
export default async function CareResourcesPage() {
  await requirePageAuth()
  const resources = await listPublishedResources()
  return <ResourcesBrowser resources={toPlain<CareResourceItem[]>(resources)} />
}
