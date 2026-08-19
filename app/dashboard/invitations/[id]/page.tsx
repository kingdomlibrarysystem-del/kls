import { InvitationDetailView } from './_components/invitation-detail-view'

interface InvitationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvitationDetailPage({ params }: InvitationDetailPageProps) {
  const { id } = await params
  return <InvitationDetailView id={id} />
}
