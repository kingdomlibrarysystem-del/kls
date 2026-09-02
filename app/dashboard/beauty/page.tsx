import { CalendarCheck, Scissors, Palette, Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

interface BeautySection {
  icon: React.ReactNode
  title: string
  desc: string
  href: string
}

const sections: BeautySection[] = [
  { icon: <CalendarCheck size={20} />, title: 'Book an Appointment', desc: 'Schedule a session with a beauty service provider from the Kingdom network.', href: '/dashboard/beauty/appointments' },
  { icon: <Scissors size={20} />,      title: 'Service Catalog',      desc: 'Browse haircare, skincare, and grooming services offered on-site or by referral.', href: '/dashboard/beauty/services' },
  { icon: <Palette size={20} />,       title: 'Provider Directory',   desc: 'View accredited stylists and therapists with ratings and specialties.',        href: '/dashboard/beauty/providers' },
  { icon: <Star size={20} />,          title: 'Reviews & Ratings',    desc: 'Members rate completed sessions to help others choose a provider.',            href: '/dashboard/beauty/reviews' },
]

export default function BeautyServicesPage() {
  return (
    <div>
      <PageHeader title="Beauty Services" subtitle="Appointments, providers, and service catalog" />

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
