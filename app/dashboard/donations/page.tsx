'use client'

import Link from 'next/link'
import { Target, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { useCampaigns } from './_shared/use-campaigns'

interface DonationsSection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: DonationsSection[] = [
  { icon: <Target size={20} />,  title: 'Campaigns', desc: 'Create and manage fundraising campaigns toward a real goal.', href: '/dashboard/donations/campaigns' },
  { icon: <Receipt size={20} />, title: 'History',   desc: 'View every real donation, its payment status, and receipts.', href: '/dashboard/donations/history' },
]

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
      <p className="font-cinzel text-2xl font-bold text-w-950">{value}</p>
      <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{label}</p>
    </div>
  )
}

/** Real Donations overview — replaces the "Coming Soon" placeholder. Pulls live totals from the same campaign store the sub-pages use. */
export default function DonationsPage() {
  const { data: campaigns } = useCampaigns()

  const active = campaigns.filter((c) => c.status === 'ACTIVE').length
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raisedRwf, 0)

  return (
    <div>
      <PageHeader title="Donations" subtitle="Campaigns, giving history, and sponsorships" />

      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatCard label="Active Campaigns" value={String(active)} />
        <StatCard label="Total Raised (RWF)" value={totalRaised.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link key={s.title} href={s.href} className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2 hover:border-w-600 transition-colors">
            <div className="flex items-center gap-2 text-w-600">{s.icon}
              <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
            </div>
            <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
