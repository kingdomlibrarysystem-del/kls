import { SessionDetailView } from './_components/session-detail-view'

interface CounselingSessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CounselingSessionDetailPage({ params }: CounselingSessionDetailPageProps) {
  const { id } = await params
  return <SessionDetailView id={id} />
}
