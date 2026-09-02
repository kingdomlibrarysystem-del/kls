'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, User, Calendar, CreditCard, RefreshCw, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { donationStatusConfig, type Donation } from '../../../_shared/donations-data'
import { pollDonationStatus } from '../../../_shared/use-donations-admin'

interface DonationDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Real donation/receipt detail page, mirrors this migration's established detail-view pattern. */
export function DonationDetailView({ id }: DonationDetailViewProps) {
  const [donation, setDonation] = useState<Donation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`/api/donations/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !json.data) { setError(json.message ?? 'Donation not found'); return }
        setDonation(json.data)
      })
      .catch(() => setError('Failed to load donation'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Donation Details" />
        <div className="space-y-3"><Skeleton className="h-20 w-full rounded-lg" /><Skeleton className="h-40 w-full rounded-lg" /></div>
      </div>
    )
  }

  if (error || !donation) {
    return (
      <div>
        <PageHeader title="Donation Details" />
        <EmptyState icon={Receipt} title="Donation not found" description={error || 'This donation does not exist.'} />
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
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{donation.amountRwf.toLocaleString()} RWF</h1>
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
