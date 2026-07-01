import { Gift, HandHeart, Receipt, Target } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <HandHeart size={20} />, title: 'Make a Donation',    desc: 'Contribute to the library, publishing fund, or a specific campaign.',     status: 'coming' },
  { icon: <Target size={20} />,    title: 'Active Campaigns',   desc: 'Browse ongoing fundraising campaigns and their progress toward goal.',     status: 'coming' },
  { icon: <Receipt size={20} />,   title: 'Donation History',   desc: 'View your past contributions and download giving receipts.',              status: 'coming' },
  { icon: <Gift size={20} />,      title: 'Sponsor a Resource', desc: 'Sponsor the acquisition of a specific book, course, or research project.', status: 'coming' },
]

export default function DonationsPage() {
  return (
    <div>
      <PageHeader title="Donations" subtitle="Campaigns, giving history, and sponsorships" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is planned for a future phase of the Kingdom Knowledge Hub — no donations can be processed yet.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-w-600">{s.icon}
              <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
            </div>
            <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
            <span className="inline-block mt-auto px-2 py-0.5 bg-w-200 text-w-700 rounded text-xs font-lato w-fit">Coming Soon</span>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-form-section border border-w-400 rounded-lg p-5">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Planned API Endpoints</h3>
        <ul className="font-lato text-xs text-w-700 space-y-1">
          <li>GET /api/donations/campaigns — active fundraising campaigns</li>
          <li>POST /api/donations — make a donation (Mobile Money, Card, Bank)</li>
          <li>GET /api/donations/my — member's donation history and receipts</li>
          <li>POST /api/donations/sponsor — sponsor a specific resource</li>
        </ul>
      </div>
    </div>
  )
}
