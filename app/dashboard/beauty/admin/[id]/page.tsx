import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getBeautyAppointmentDetail } from '@/lib/data/beauty-appointments'
import { toPlain } from '@/lib/server/to-plain'
import { AppointmentDetailView } from './_components/appointment-detail-view'
import type { BeautyAppointment } from '../../_shared/beauty-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getBeautyAppointmentDetail(id)
  if (!detail) notFound()
  return <AppointmentDetailView initialAppointment={toPlain<BeautyAppointment>(detail.data)} />
}
