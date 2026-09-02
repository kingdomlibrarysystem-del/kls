import { CampaignDetailView } from './_components/campaign-detail-view'

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params
  return <CampaignDetailView id={id} />
}
