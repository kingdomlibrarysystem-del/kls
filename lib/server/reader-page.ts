import { getResourceDetail } from '@/lib/data/resources'
import { getGatedChapters } from '@/lib/data/chapters'
import { getPageSession, isStaffRole } from '@/lib/server/page-session'
import { toPlain } from '@/lib/server/to-plain'
import type { Resource } from '@/app/dashboard/library/_components/resources-data'
import type { Chapter } from '@/app/member/_shared/readable-content-data'

/** Everything the reader needs for ONE book — the resource and its entitlement-gated chapters, loaded in parallel. */
export async function loadReaderData(resourceId: string) {
  const session = await getPageSession()
  const [resource, chapters] = await Promise.all([
    getResourceDetail(resourceId),
    getGatedChapters(resourceId, session?.userId, !!session && isStaffRole(session.role)),
  ])
  return {
    resource: resource ? toPlain<Resource>(resource) : null,
    readableChapters: chapters ? toPlain<Chapter[]>(chapters) : null,
  }
}
