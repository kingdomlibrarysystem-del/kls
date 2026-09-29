import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getDonationDetail } from '@/lib/data/donations'
import { toPlain } from '@/lib/server/to-plain'
import { DonationDetailView } from './_components/donation-detail-view'
import type { Donation } from '../../_shared/donations-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getDonationDetail(id)
  if (!detail) notFound()
  return <DonationDetailView initialDonation={toPlain<Donation>(detail.data)} />
}
