import { ClipboardList, CalendarCheck, TrendingUp, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

interface RehabSection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: RehabSection[] = [
  { icon: <ClipboardList size={20} />, title: 'Intake & Assessment', desc: 'Complete an initial assessment to build a personalized recovery plan.',   href: '/dashboard/rehabilitation/intake' },
  { icon: <CalendarCheck size={20} />, title: 'Program Schedule',    desc: 'View your scheduled rehabilitation sessions and check-ins.',              href: '/dashboard/rehabilitation/schedule' },
  { icon: <TrendingUp size={20} />,    title: 'Progress Tracking',   desc: 'Track milestones and recovery progress over time with staff support.',    href: '/dashboard/rehabilitation/progress' },
  { icon: <Users size={20} />,         title: 'Support Groups',      desc: 'Join peer support groups facilitated by program staff.',                  href: '/dashboard/rehabilitation/groups' },
]

export default function RehabilitationPage() {
  return (
    <div>
      <PageHeader title="Rehabilitation" subtitle="Recovery programs, scheduling, and progress tracking" />

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
