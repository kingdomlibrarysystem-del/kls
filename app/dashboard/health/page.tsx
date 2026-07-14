import { CalendarCheck, FileText, Syringe, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

interface HealthSection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: HealthSection[] = [
  { icon: <CalendarCheck size={20} />, title: 'Book a Checkup',       desc: 'Schedule a general health checkup with a partnered clinic.',        href: '/dashboard/health/checkups' },
  { icon: <FileText size={20} />,      title: 'Health Records',       desc: 'View your consultation history, prescriptions, and referrals.',     href: '/dashboard/health/records' },
  { icon: <Syringe size={20} />,       title: 'Immunization Tracker', desc: 'Track vaccination records and upcoming immunization reminders.',    href: '/dashboard/health/immunizations' },
  { icon: <Stethoscope size={20} />,   title: 'Clinic Directory',     desc: 'Browse partnered clinics and health practitioners by specialty.',   href: '/dashboard/health/clinics' },
]

export default function HealthSystemPage() {
  return (
    <div>
      <PageHeader title="Health System" subtitle="Checkups, records, and clinic partnerships" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
