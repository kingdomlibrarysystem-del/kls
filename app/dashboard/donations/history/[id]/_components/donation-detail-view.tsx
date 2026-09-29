'use client'

import { useState } from 'react'
import { ArrowLeft, User, Calendar, CreditCard, RefreshCw, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { donationStatusConfig, type Donation } from '../../../_shared/donations-data'
import { pollDonationStatus } from '../../../_shared/use-donations-admin'

interface DonationDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialDonation: Donation
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/** Real donation/receipt detail page, mirrors this migration's established detail-view pattern. */
export function DonationDetailView({ initialDonation }: DonationDetailViewProps) {
  const id = initialDonation.id
  const [donation, setDonation] = useState<Donation | null>(initialDonation)

  /** Re-reads the record after an action (the first copy comes from the server page); keeps the last known copy if the refresh fails. */
  const load = () => {
    fetch(`/api/donations/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success' && json.data) setDonation(json.data) })
      .catch(() => {})
  }

  if (!donation) {
    return (
      <div>
        <PageHeader title="Donation Details" />
        <EmptyState icon={Receipt} title="Donation not found" description={'This donation does not exist.'} />
        <div className="mt-4"><UniversalButton href="/dashboard/donations/history" variant="outline" icon={<ArrowLeft size={14} />}>Back to History</UniversalButton></div>
      </div>
    )
  }

  const handlePoll = async () => {
    try { await pollDonationStatus(id); load() } catch { /* stays pending */ }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/donations/history" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to History</UniversalButton>
        {donation.status === 'pending' && <UniversalButton variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={handlePoll}>Check Status</UniversalButton>}
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950" suppressHydrationWarning>{donation.amountRwf.toLocaleString()} RWF</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${donationStatusConfig[donation.status].cls}`}>{donationStatusConfig[donation.status].label}</span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Donor" value={donation.isAnonymous ? 'Anonymous' : donation.donorName} />
          <DetailRow icon={<CreditCard size={13} />} label="Method" value={donation.method ?? '—'} />
          <DetailRow icon={<Calendar size={13} />} label="Date" value={new Date(donation.createdAt).toLocaleString()} />
          {donation.paidAt && <DetailRow icon={<Calendar size={13} />} label="Paid" value={new Date(donation.paidAt).toLocaleString()} />}
          {donation.message && <DetailRow icon={<Receipt size={13} />} label="Message" value={donation.message} />}
        </div>
      </div>
    </div>
  )
}
