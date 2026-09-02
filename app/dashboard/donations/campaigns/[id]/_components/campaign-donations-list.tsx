'use client'

import { RefreshCw } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { donationStatusConfig, type Donation } from '../../../_shared/donations-data'
import { pollDonationStatus } from '../../../_shared/use-donations-admin'

interface CampaignDonationsListProps {
  donations: Donation[]
  onRefreshed: () => void
}

/** Real donations against this campaign, with a manual "check status" button for a stuck PENDING row — PayPack has no sandbox, so this is the only safe way to verify a payment's real status without waiting on a live webhook. */
export function CampaignDonationsList({ donations, onRefreshed }: CampaignDonationsListProps) {
  const handlePoll = async (id: string) => {
    try { await pollDonationStatus(id); onRefreshed() } catch { /* stays pending, staff can retry */ }
  }

  if (donations.length === 0) {
    return <EmptyState icon={RefreshCw} title="No donations yet" description="Real donations against this campaign will appear here." />
  }

  return (
    <div className="bg-white border border-w-300 rounded-lg overflow-hidden">
      {donations.map((d) => (
        <div key={d.id} className="px-4 py-3 border-b border-w-200 last:border-b-0 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-40">
            <p className="font-lato text-sm font-semibold text-w-950">{d.donorName}</p>
            <p className="font-lato text-xs text-w-700">{d.amountRwf.toLocaleString()} RWF · {new Date(d.createdAt).toLocaleDateString()}</p>
            {d.message && <p className="font-lato text-xs text-w-600 italic mt-1">&ldquo;{d.message}&rdquo;</p>}
          </div>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${donationStatusConfig[d.status].cls}`}>{donationStatusConfig[d.status].label}</span>
          {d.status === 'pending' && (
            <button onClick={() => handlePoll(d.id)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <RefreshCw size={12} /> Check Status
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
