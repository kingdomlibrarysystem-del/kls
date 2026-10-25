import { notFound } from 'next/navigation'
import { requireStaffPage, pageHasPermission } from '@/lib/server/page-session'
import { listCollections, type CollectionOption } from '@/lib/data/klp-register'
import { getResourceDetail } from '@/lib/data/resources'
import { toPlain } from '@/lib/server/to-plain'
import { ResourceDetailView } from './_components/resource-detail-view'
import type { Resource } from '../_components/resources-data'

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  // Staff page: drafts included (this is where they are reviewed).
  const [resource, canApprove, collections] = await Promise.all([getResourceDetail(id, { includeDraft: true }), pageHasPermission('library:approve'), listCollections()])
  if (!resource) notFound()
  return <ResourceDetailView initialResource={toPlain<Resource>(resource)} canApprove={canApprove} collections={toPlain<CollectionOption[]>(collections)} />
}
