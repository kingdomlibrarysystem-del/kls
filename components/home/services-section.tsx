'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { LifeCycle } from '@/components/services/life-cycle'
import { ProgramCard } from '@/components/services/program-card'
import type { LifeAreaItem, ServiceProgramItem } from '@/lib/services/shared'

/** Home page block: the life cycle and the programme cards, with a link to the full /services page. Data comes from the server page. */
export function ServicesSection({ programs, areas }: { programs: ServiceProgramItem[]; areas: LifeAreaItem[] }) {
  const { t } = useLanguage()
  if (programs.length === 0) return null
  return (
    <section id="services" className="bg-background py-14">
      <div className="mx-auto max-w-7xl space-y-10 px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t('services.eyebrow')}</p>
          <h2 className="mt-2 font-cinzel text-2xl font-bold uppercase tracking-wide text-foreground sm:text-3xl">{t('services.programs_title')}</h2>
          <p className="mt-1 text-sm italic text-muted-foreground">{t('services.programs_sub')}</p>
        </div>
        <LifeCycle areas={areas} compact />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {programs.map((p) => <ProgramCard key={p.id} program={p} areaCount={areas.length} />)}
        </div>
        <div className="text-center">
          <Link href="/services" className={buttonVariants({ variant: 'outline', size: 'lg' })}>{t('services.all_services')} <ArrowRight /></Link>
        </div>
      </div>
    </section>
  )
}
