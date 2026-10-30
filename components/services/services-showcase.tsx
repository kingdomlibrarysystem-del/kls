'use client'

import Link from 'next/link'
import { ArrowLeftRight, BookOpen, CheckCircle2, Eye, Globe2, HandHeart, Medal, ShieldCheck, Target, UsersRound } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import type { LifeAreaItem, ServiceProgramItem } from '@/lib/services/shared'
import { LifeCycle } from './life-cycle'
import { ProgramCard } from './program-card'

interface Props {
  programs: ServiceProgramItem[]
  areas: LifeAreaItem[]
  /** /services for guests, /member/services inside the member portal. */
  basePath?: string
  /** Where "Join" goes — registration for guests; hidden for signed-in members. */
  joinHref?: string | null
}

const WHY_ICONS = [Globe2, Medal, ShieldCheck, UsersRound, HandHeart]

/**
 * The full services overview, laid out like the Kingdom Library overview
 * sheet: mission & vision, the life cycle, the programmes, how Kingdom
 * Library and Global Rehab Center connect, why choose us, and a join call.
 * Programmes and life areas come from the database (admin-managed); the
 * surrounding copy is translated (locales/*.json → services.*).
 */
export function ServicesShowcase({ programs, areas, basePath = '/services', joinHref = '/auth/register' }: Props) {
  const { t } = useLanguage()

  return (
    <div className="space-y-12">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14213d] via-[#1d2d50] to-[#0b1426] px-6 py-10 text-white shadow-lg sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{t('services.eyebrow')}</p>
        <h1 className="mt-2 font-cinzel text-3xl font-bold sm:text-4xl">{t('services.title')}</h1>
        <p className="mt-3 max-w-2xl text-base text-white/85">{t('services.subtitle')}</p>
        <p className="mt-5 font-cinzel text-sm font-semibold tracking-[0.3em] text-amber-300">{t('services.motto')}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard icon={Target} title={t('services.mission_title')} text={t('services.mission_text')} />
        <InfoCard icon={Eye} title={t('services.vision_title')} text={t('services.vision_text')} />
      </section>

      <LifeCycle areas={areas} />

      <section aria-labelledby="programs-title">
        <div className="text-center">
          <h2 id="programs-title" className="font-cinzel text-xl font-bold uppercase tracking-wide text-foreground sm:text-2xl">{t('services.programs_title')}</h2>
          <p className="mt-1 text-sm italic text-muted-foreground">{t('services.programs_sub')}</p>
        </div>
        {programs.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">{t('services.empty')}</p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {programs.map((p) => <ProgramCard key={p.id} program={p} areaCount={areas.length} basePath={basePath} />)}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
          <h2 className="font-cinzel text-lg font-bold uppercase text-foreground">{t('services.connects_title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('services.connects_text')}</p>
          <div className="mt-5 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-lg bg-[#14213d] p-4 text-center text-white">
              <BookOpen className="mx-auto size-7 text-amber-300" aria-hidden />
              <p className="mt-2 font-cinzel font-bold uppercase">{t('services.kl_name')}</p>
              <p className="mt-1 text-xs text-white/80">{t('services.kl_items')}</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-2 text-center text-xs font-semibold text-muted-foreground">
              <ArrowLeftRight className="size-6 text-foreground" aria-hidden />
              <span className="max-w-[8rem]">{t('services.working_together')}</span>
            </div>
            <div className="rounded-lg bg-emerald-800 p-4 text-center text-white">
              <HandHeart className="mx-auto size-7 text-emerald-200" aria-hidden />
              <p className="mt-2 font-cinzel font-bold uppercase">{t('services.grc_name')}</p>
              <p className="mt-1 text-xs text-white/80">{t('services.grc_items')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-[#14213d] p-5 text-white shadow-xs">
          <h2 className="font-cinzel text-lg font-bold uppercase">{t('services.why_title')}</h2>
          <ul className="mt-4 space-y-3">
            {WHY_ICONS.map((Icon, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/30"><Icon className="size-4" aria-hidden /></span>
                {t(`services.why_${i + 1}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {joinHref && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/40 px-6 py-8 text-center">
          <CheckCircle2 className="size-8 text-primary" aria-hidden />
          <p className="font-cinzel text-lg font-bold text-foreground">{t('services.join_sub')}</p>
          <Link href={joinHref} className={buttonVariants({ size: 'lg' })}>{t('services.join')}</Link>
        </section>
      )}
    </div>
  )
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-5" aria-hidden /></span>
      <div>
        <h2 className="font-cinzel text-lg font-bold uppercase text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
