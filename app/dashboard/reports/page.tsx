import { BarChart3, Users, BookOpen, GraduationCap, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <Users size={20} />,         title: 'Membership Trends',   desc: 'Track member growth, active users, and engagement over time.',       status: 'coming' },
  { icon: <BookOpen size={20} />,      title: 'Library Analytics',   desc: 'Borrowing volume, popular resources, and inventory turnover.',        status: 'coming' },
  { icon: <GraduationCap size={20} />, title: 'Learning Analytics',  desc: 'Course enrollment, completion rates, and assessment performance.',    status: 'coming' },
  { icon: <FileText size={20} />,      title: 'Publishing Reports',  desc: 'Submission throughput, approval rates, and revenue summaries.',       status: 'coming' },
]

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Cross-module trends and platform-wide statistics" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is under active development. A unified analytics dashboard arrives in a later phase.
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
          <li>GET /api/reports/membership — membership growth and engagement</li>
          <li>GET /api/reports/library — borrowing and inventory analytics</li>
          <li>GET /api/reports/learning — enrollment and completion analytics</li>
          <li>GET /api/reports/publishing — submission and revenue analytics</li>
        </ul>
      </div>
    </div>
  )
}
