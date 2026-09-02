'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Target, Tag, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { campaignStatusConfig, type DonationCampaign } from '../../../_shared/donations-data'
import { useCampaignDonations } from '../../../_shared/use-donations-admin'
import { CampaignDonationsList } from './campaign-donations-list'

interface CampaignDetailViewProps {
  id: string
}

/** Campaign detail — goal/raised progress bar, real donations list, manual reconciliation via CampaignDonationsList. */
export function CampaignDetailView({ id }: CampaignDetailViewProps) {
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: donations, loading: donationsLoading } = useCampaignDonations(id)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/donations/campaigns/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !json.data) { setError(json.message ?? 'Campaign not found'); return }
        setCampaign(json.data)
      })
      .catch(() => setError('Failed to load campaign'))
      .finally(() => setLoading(false))
  }, [id, refreshKey])

  if (loading) {
    return (
      <div>
        <PageHeader title="Campaign Details" />
        <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-40 w-full rounded-lg" /></div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div>
        <PageHeader title="Campaign Details" />
        <EmptyState icon={AlertTriangle} title="Campaign not found" description={error || 'This campaign does not exist.'} />
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
          <div className="flex items-center gap-2 font-lato text-sm font-semibold text-w-950"><Target size={14} /> {campaign.raisedRwf.toLocaleString()} / {campaign.goalRwf.toLocaleString()} RWF ({progressPercent.toFixed(0)}%)</div>
          <div className="w-full h-2 rounded-full bg-w-200 overflow-hidden"><div className="h-full bg-w-600" style={{ width: `${progressPercent}%` }} /></div>
        </div>

        <h2 className="font-cinzel text-sm font-semibold text-w-950">Donations</h2>
        {donationsLoading ? <Skeleton className="h-32 w-full rounded-lg" /> : <CampaignDonationsList donations={donations} onRefreshed={() => setRefreshKey((k) => k + 1)} />}
      </div>
    </div>
  )
}
