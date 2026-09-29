'use client'

import { useState } from 'react'
import { ArrowLeft, Target, Tag, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { campaignStatusConfig, type DonationCampaign } from '../../../_shared/donations-data'
import { useCampaignDonations } from '../../../_shared/use-donations-admin'
import { CampaignDonationsList } from './campaign-donations-list'

interface CampaignDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialCampaign: DonationCampaign
}

/** Campaign detail — goal/raised progress bar, real donations list, manual reconciliation via CampaignDonationsList. */
export function CampaignDetailView({ initialCampaign }: CampaignDetailViewProps) {
  const id = initialCampaign.id
  const [campaign, setCampaign] = useState<DonationCampaign | null>(initialCampaign)
  const { data: donations, loading: donationsLoading } = useCampaignDonations(id)

  /** Re-reads the campaign (raised total) after a donation is reconciled; keeps the last copy if that fails. */
  const refreshCampaign = () => {
    fetch(`/api/donations/campaigns/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success' && json.data) setCampaign(json.data) })
      .catch(() => {})
  }

  if (!campaign) {
    return (
      <div>
        <PageHeader title="Campaign Details" />
        <EmptyState icon={AlertTriangle} title="Campaign not found" description={'This campaign does not exist.'} />
        <div className="mt-4"><UniversalButton href="/dashboard/donations/campaigns" variant="outline" icon={<ArrowLeft size={14} />}>Back to Campaigns</UniversalButton></div>
      </div>
    )
  }

  const progressPercent = Math.min(100, (campaign.raisedRwf / campaign.goalRwf) * 100)

  return (
    <div>
      <div className="mb-6"><UniversalButton href="/dashboard/donations/campaigns" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Campaigns</UniversalButton></div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{campaign.title}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${campaignStatusConfig[campaign.status].cls}`}>{campaignStatusConfig[campaign.status].label}</span>
        </div>

        <p className="font-lato text-sm text-w-700 leading-relaxed">{campaign.description}</p>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <div className="flex items-center gap-2 font-lato text-xs text-w-700"><Tag size={13} /> {campaign.category}</div>
          <div className="flex items-center gap-2 font-lato text-sm font-semibold text-w-950" suppressHydrationWarning><Target size={14} /> {campaign.raisedRwf.toLocaleString()} / {campaign.goalRwf.toLocaleString()} RWF ({progressPercent.toFixed(0)}%)</div>
          <div className="w-full h-2 rounded-full bg-w-200 dark:bg-white/10 overflow-hidden"><div className="h-full bg-w-600" style={{ width: `${progressPercent}%` }} /></div>
        </div>

        <h2 className="font-cinzel text-sm font-semibold text-w-950">Donations</h2>
        {donationsLoading ? <Skeleton className="h-32 w-full rounded-lg" /> : <CampaignDonationsList donations={donations} onRefreshed={refreshCampaign} />}
      </div>
    </div>
  )
}
