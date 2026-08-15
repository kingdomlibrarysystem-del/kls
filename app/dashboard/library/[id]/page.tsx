import { ResourceDetailView } from './_components/resource-detail-view'

interface ResourceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { id } = await params
  return <ResourceDetailView id={id} />
}
