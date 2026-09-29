import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getDonationCampaignDetail } from '@/lib/data/donation-campaigns'
import { toPlain } from '@/lib/server/to-plain'
import { CampaignDetailView } from './_components/campaign-detail-view'
import type { DonationCampaign } from '../../_shared/donations-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const detail = await getDonationCampaignDetail(id)
  if (!detail) notFound()
  return <CampaignDetailView initialCampaign={toPlain<DonationCampaign>(detail)} />
}
