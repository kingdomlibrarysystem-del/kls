import { ReservationDetailView } from './_components/reservation-detail-view'

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = await params
  return <ReservationDetailView id={id} />
}
