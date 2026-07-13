import { Brain, MessageCircle, CalendarCheck, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <CalendarCheck size={20} />, title: 'Book a Session',       desc: 'Schedule a confidential consultation with an accredited counselor.',         status: 'coming' },
  { icon: <MessageCircle size={20} />, title: 'Session History',      desc: "Review your past sessions, notes, and follow-up recommendations.",           status: 'coming' },
  { icon: <Users size={20} />,         title: 'Counselor Directory',  desc: 'Browse counselors by specialty — family, spiritual, career, and more.',      status: 'coming' },
  { icon: <ShieldCheck size={20} />,   title: 'Privacy & Consent',    desc: 'Manage consent settings and confidentiality preferences for your records.',  status: 'coming' },
]

export default function CounselingPage() {
  return (
    <div>
      <PageHeader title="Consultation & Counseling" subtitle="Confidential support, scheduling, and records" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is planned for a future phase of the Kingdom Knowledge Hub — no sessions can be booked yet.
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
          <li>GET /api/counseling/counselors — accredited counselor directory</li>
          <li>POST /api/counseling/sessions — request a session</li>
          <li>GET /api/counseling/sessions/my — member's session history</li>
          <li>PATCH /api/counseling/consent — update privacy/consent settings</li>
        </ul>
      </div>
    </div>
  )
}
