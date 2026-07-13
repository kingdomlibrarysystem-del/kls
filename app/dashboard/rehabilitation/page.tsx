import { RefreshCcw, ClipboardList, CalendarCheck, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <ClipboardList size={20} />, title: 'Intake & Assessment', desc: 'Complete an initial assessment to build a personalized recovery plan.',   status: 'coming' },
  { icon: <CalendarCheck size={20} />, title: 'Program Schedule',    desc: 'View and manage scheduled rehabilitation sessions and check-ins.',        status: 'coming' },
  { icon: <TrendingUp size={20} />,    title: 'Progress Tracking',   desc: 'Track milestones and recovery progress over time with staff support.',    status: 'coming' },
  { icon: <Users size={20} />,         title: 'Support Groups',      desc: 'Join peer support groups facilitated by program staff.',                  status: 'coming' },
]

export default function RehabilitationPage() {
  return (
    <div>
      <PageHeader title="Rehabilitation" subtitle="Recovery programs, scheduling, and progress tracking" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is planned for a future phase of the Kingdom Knowledge Hub — no programs are active yet.
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
          <li>POST /api/rehabilitation/intake — submit intake assessment</li>
          <li>GET /api/rehabilitation/schedule — member's program schedule</li>
          <li>GET /api/rehabilitation/progress — recovery milestones and progress</li>
          <li>GET /api/rehabilitation/groups — available support groups</li>
        </ul>
      </div>
    </div>
  )
}
