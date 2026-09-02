import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CampaignsView } from './_components/campaigns-view'

export default function DonationCampaignsPage() {
  return (
    <PageTransition>
      <PageHeader title="Campaigns" subtitle="Create and manage fundraising campaigns" />
      <CampaignsView />
    </PageTransition>
  )
}
