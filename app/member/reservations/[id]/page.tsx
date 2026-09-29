import { notFound } from 'next/navigation'
import { requirePageAuth, canAccessOwned } from '@/lib/server/page-session'
import { getReservationDetail } from '@/lib/data/reservations'
import { toPlain } from '@/lib/server/to-plain'
import { ReservationDetailView } from './_components/reservation-detail-view'
import type { Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const [{ id }, session] = await Promise.all([params, requirePageAuth()])
  const detail = await getReservationDetail(id)
  // Same owner-or-staff rule as GET /api/reservations/[id].
  if (!detail || !canAccessOwned(session, detail.ownerId)) notFound()
  return <ReservationDetailView initialReservation={toPlain<Reservation>(detail.reservation)} />
}
