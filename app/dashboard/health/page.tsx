import { HeartPulse, Stethoscope, CalendarCheck, FileText, Syringe } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <CalendarCheck size={20} />, title: 'Book a Checkup',      desc: 'Schedule a general health checkup with a partnered clinic.',              status: 'coming' },
  { icon: <FileText size={20} />,      title: 'Health Records',      desc: 'View your consultation history, prescriptions, and referrals.',           status: 'coming' },
  { icon: <Syringe size={20} />,       title: 'Immunization Tracker', desc: 'Track vaccination records and upcoming immunization reminders.',         status: 'coming' },
  { icon: <Stethoscope size={20} />,   title: 'Clinic Directory',    desc: 'Browse partnered clinics and health practitioners by specialty.',         status: 'coming' },
]

export default function HealthSystemPage() {
  return (
    <div>
      <PageHeader title="Health System" subtitle="Checkups, records, and clinic partnerships" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is planned for a future phase of the Kingdom Knowledge Hub — no health records are stored yet.
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
          <li>GET /api/health/clinics — partnered clinic directory</li>
          <li>POST /api/health/appointments — book a checkup</li>
          <li>GET /api/health/records/my — member's health records</li>
          <li>GET /api/health/immunizations — vaccination tracker</li>
        </ul>
      </div>
    </div>
  )
}
