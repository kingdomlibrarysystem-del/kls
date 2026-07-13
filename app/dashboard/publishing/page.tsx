import Link from 'next/link'
import { BookCopy, Upload, CheckCircle, DollarSign, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

interface PublishingSection {
  icon: React.ReactNode
  title: string
  desc: string
  href?: string
}

const sections: PublishingSection[] = [
  { icon: <Upload size={20} />,      title: 'Submit a Book',         desc: 'Upload your manuscript with cover image, metadata, and category for Manager review.' },
  { icon: <BookCopy size={20} />,    title: 'My Submissions',        desc: 'Track draft, submitted, under review, approved, and rejected publications.' },
  { icon: <CheckCircle size={20} />, title: 'Review & Approval',     desc: 'Managers review submitted books, provide feedback, and approve for publishing.',       href: '/dashboard/publishing/review' },
  { icon: <DollarSign size={20} />,  title: 'Revenue & Royalties',   desc: 'Track earnings per publication and configure default revenue-share rules.',            href: '/dashboard/publishing/revenue' },
  { icon: <Search size={20} />,      title: 'Publication Catalog',   desc: 'Browse all published books. Filter by language and contributor.',                      href: '/dashboard/publishing/catalog' },
]

export default function PublishingPage() {
  return (
    <div>
      <PageHeader title="Publishing Services" subtitle="Submit, review, publish, and track revenue" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. Submission → Review → Approval → Publish workflow.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const card = (
            <div className={`bg-form-highlight border border-w-300 rounded-lg p-5 flex flex-col gap-2 h-full ${s.href ? 'hover:border-w-600 transition-colors' : ''}`}>
              <div className="flex items-center gap-2 text-w-600">{s.icon}
                <h3 className="font-cinzel text-sm font-semibold text-w-950">{s.title}</h3>
              </div>
              <p className="font-lato text-xs text-w-700 leading-relaxed">{s.desc}</p>
              <span className={`inline-block mt-auto px-2 py-0.5 rounded text-xs font-lato w-fit ${
                s.href ? 'bg-green-50 text-green-700' : 'bg-w-200 text-w-700'
              }`}>
                {s.href ? 'Available' : 'Coming Soon'}
              </span>
            </div>
          )
          return s.href ? (
            <Link key={s.title} href={s.href} aria-label={s.title}>{card}</Link>
          ) : (
            <div key={s.title}>{card}</div>
          )
        })}
      </div>

      <div className="mt-8 bg-form-section border border-w-400 rounded-lg p-5">
        <h3 className="font-cinzel text-sm font-semibold text-w-950 mb-2">Planned API Endpoints</h3>
        <ul className="font-lato text-xs text-w-700 space-y-1">
          <li>POST /api/publications — submit a new book (draft)</li>
          <li>PATCH /api/publications/:id/submit — submit draft for review</li>
          <li>PATCH /api/publications/:id/approve — Manager approves</li>
          <li>PATCH /api/publications/:id/reject — Manager rejects with notes</li>
          <li>GET /api/publications/my — contributor's own publications</li>
          <li>GET /api/publications/revenue — earnings dashboard</li>
        </ul>
      </div>
    </div>
  )
}
