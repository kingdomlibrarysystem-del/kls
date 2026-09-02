import { DonationDetailView } from './_components/donation-detail-view'

interface DonationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DonationDetailPage({ params }: DonationDetailPageProps) {
  const { id } = await params
  return <DonationDetailView id={id} />
}
