import { SessionDetailView } from './_components/session-detail-view'

interface RehabSessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RehabSessionDetailPage({ params }: RehabSessionDetailPageProps) {
  const { id } = await params
  return <SessionDetailView id={id} />
}
