import { AppointmentDetailView } from './_components/appointment-detail-view'

interface BeautyAppointmentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BeautyAppointmentDetailPage({ params }: BeautyAppointmentDetailPageProps) {
  const { id } = await params
  return <AppointmentDetailView id={id} />
}
