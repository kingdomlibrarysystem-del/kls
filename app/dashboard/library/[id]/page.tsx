import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getResourceDetail } from '@/lib/data/resources'
import { toPlain } from '@/lib/server/to-plain'
import { ResourceDetailView } from './_components/resource-detail-view'
import type { Resource } from '../_components/resources-data'

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const resource = await getResourceDetail(id)
  if (!resource) notFound()
  return <ResourceDetailView initialResource={toPlain<Resource>(resource)} />
}
