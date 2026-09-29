import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getReservationDetail } from '@/lib/data/reservations'
import { toPlain } from '@/lib/server/to-plain'
import { ReservationDetailView } from './_components/reservation-detail-view'
import type { Reservation } from '../_components/reservations-data'

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getReservationDetail(id)
  if (!detail) notFound()
  return <ReservationDetailView initialReservation={toPlain<Reservation>(detail.reservation)} />
}
