import { BookCopy, Upload, CheckCircle, DollarSign, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <Upload size={20} />,      title: 'Submit a Book',         desc: 'Upload your manuscript with cover image, metadata, and category for Manager review.', status: 'coming' },
  { icon: <BookCopy size={20} />,    title: 'My Submissions',        desc: 'Track draft, submitted, under review, approved, and rejected publications.',          status: 'coming' },
  { icon: <CheckCircle size={20} />, title: 'Review & Approval',     desc: 'Managers review submitted books, provide feedback, and approve for publishing.',       status: 'coming' },
  { icon: <DollarSign size={20} />,  title: 'Revenue & Royalties',   desc: 'Track earnings per publication and view payout history based on revenue-share rules.', status: 'coming' },
  { icon: <Search size={20} />,      title: 'Publication Catalog',   desc: 'Browse all published books. Filter by language, category, and contributor.',           status: 'coming' },
]

export default function PublishingPage() {
  return (
    <div>
      <PageHeader title="Publishing Services" subtitle="Submit, review, publish, and track revenue" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. Submission → Review → Approval → Publish workflow.
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
