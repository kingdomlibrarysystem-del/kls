import { CalendarCheck, MessageCircle, Users, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

interface CounselingSection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: CounselingSection[] = [
  { icon: <CalendarCheck size={20} />, title: 'Book a Session',       desc: 'Schedule a confidential consultation with an accredited counselor.',         href: '/dashboard/counseling/sessions' },
  { icon: <MessageCircle size={20} />, title: 'Session History',      desc: "Review your past sessions, notes, and follow-up recommendations.",           href: '/dashboard/counseling/history' },
  { icon: <Users size={20} />,         title: 'Counselor Directory',  desc: 'Browse counselors by specialty — family, spiritual, career, and more.',      href: '/dashboard/counseling/counselors' },
  { icon: <ShieldCheck size={20} />,   title: 'Privacy & Consent',    desc: 'Manage consent settings and confidentiality preferences for your records.',  href: '/dashboard/counseling/consent' },
]

export default function CounselingPage() {
  return (
    <div>
      <PageHeader title="Consultation & Counseling" subtitle="Confidential support, scheduling, and records" />

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
