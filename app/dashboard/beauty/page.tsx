import { Sparkles, Scissors, Palette, CalendarCheck, Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

const sections = [
  { icon: <CalendarCheck size={20} />, title: 'Book an Appointment', desc: 'Schedule a session with a beauty service provider from the Kingdom network.', status: 'coming' },
  { icon: <Scissors size={20} />,      title: 'Service Catalog',      desc: 'Browse haircare, skincare, and grooming services offered on-site or by referral.', status: 'coming' },
  { icon: <Palette size={20} />,       title: 'Provider Directory',   desc: 'View accredited stylists and therapists with ratings and specialties.',        status: 'coming' },
  { icon: <Star size={20} />,          title: 'Reviews & Ratings',    desc: 'Members rate completed sessions to help others choose a provider.',            status: 'coming' },
]

export default function BeautyServicesPage() {
  return (
    <div>
      <PageHeader title="Beauty Services" subtitle="Appointments, providers, and service catalog" />

      <div className="bg-w-100 border border-w-300 rounded-lg px-5 py-4 mb-8 font-lato text-sm text-w-700">
        This module is planned for a future phase of the Kingdom Knowledge Hub — no bookings can be made yet.
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
          <li>GET /api/beauty/providers — list accredited providers</li>
          <li>GET /api/beauty/services — service catalog with pricing</li>
          <li>POST /api/beauty/appointments — book an appointment</li>
          <li>GET /api/beauty/appointments/my — member's appointment history</li>
        </ul>
      </div>
    </div>
  )
}
