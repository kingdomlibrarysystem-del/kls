'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, PenLine, PlayCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { accountHomeFor } from '@/components/profile-dropdown'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { HeroRooms, type HeroBook } from './hero-rooms'

interface HeroSectionProps {
  /** Real totals from the database; a total of 0 is simply not shown. */
  stats?: { books: number; courses: number; learners: number }
  /** The newest books with a cover (shown in the hero's rooms). */
  books?: HeroBook[]
}

// Hero colours: deep navy (#12304a, the blue of the logo family) with parchment text and the brand gold.
const PARCHMENT = 'text-[#f6efe0]'
const PARCHMENT_SOFT = 'text-[#f6efe0]/70'

/**
 * Landing hero, scripture first, on a deep navy band that continues the
 * header. Left: the message, Start reading / Explore courses, account link and
 * real totals. Right: a grid of three "rooms" (hero-rooms.tsx) — the two
 * newest books and today's Daily Wisdom, each on its own photo — that swap
 * places so each takes a turn in the big tile, shown in full there.
 * Below the band: Library / E-Learning / Publishing cards, each with a photo.
 * Motion: rise-in on load, the rooms swapping places, card
 * hover — all off for "reduce motion" (see globals.css).
 */
export function HeroSection({ stats, books = [] }: HeroSectionProps) {
  const { t } = useLanguage()
  const { user, isAuthenticated } = useAuth()

  const totals = [
    { value: stats?.books ?? 0, label: t('hero.stat_books') },
    { value: stats?.courses ?? 0, label: t('hero.stat_courses') },
    { value: stats?.learners ?? 0, label: t('hero.stat_learners') },
  ].filter((s) => s.value > 0)

  const paths = [
    { icon: <BookOpen />, title: t('hero.library_tag'), body: t('hero.library_body'), cta: t('hero.library_cta'), href: '/library', image: '/home/bible-hands.jpg', alt: 'Hands holding an open Bible' },
    { icon: <GraduationCap />, title: t('hero.elearning_tag'), body: t('hero.elearning_body'), cta: t('hero.elearning_cta'), href: '/e-learning', image: '/home/bible-tablet-study.jpg', alt: 'A man studying the Bible with a tablet' },
    { icon: <PenLine />, title: t('hero.publishing_tag'), body: t('hero.publishing_body'), cta: t('hero.publishing_cta'), href: '/publish', image: '/home/woman-writing.jpg', alt: 'A woman writing in her notebook' },
  ]

  return (
    <>
      <section className="relative overflow-hidden bg-[#12304a] dark:bg-[#080b16]">
        {/* Soft blue light from the top left and a faint gold glow behind the photos (decorative). */}
        <div aria-hidden className="pointer-events-none absolute -left-40 -top-48 size-[620px] rounded-full bg-[#2a5f8f]/45 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 bottom-0 size-[520px] rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-28 lg:pt-20">
          {/* Message */}
          <div className="text-center lg:text-left">
            <p className="kls-rise inline-flex items-center gap-3 font-lato text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <span aria-hidden className="h-px w-8 bg-primary" />
              {t('hero.eyebrow')}
            </p>

            <h1 className={cn('kls-rise mt-6 text-balance font-cinzel text-[2rem] font-bold leading-[1.1] sm:text-5xl lg:text-[3.25rem]', PARCHMENT)} style={{ '--kls-delay': '0.1s' } as React.CSSProperties}>
              <span className="block">{t('hero.title_1').trim()}</span>
              <span className="mt-1 block text-primary">{t('hero.title_2')}</span>
            </h1>

            <p className={cn('kls-rise mx-auto mt-6 max-w-xl font-lato text-base leading-relaxed sm:text-lg lg:mx-0', PARCHMENT_SOFT)} style={{ '--kls-delay': '0.2s' } as React.CSSProperties}>
              {t('hero.subtitle')}
            </p>

            <div className="kls-rise mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start" style={{ '--kls-delay': '0.3s' } as React.CSSProperties}>
              <Link href="/library" className={cn(buttonVariants({ size: 'lg' }), 'h-12 gap-2 px-7 font-lato text-base font-bold shadow-lg shadow-primary/30')}>
                <BookOpen className="size-5" /> {t('hero.cta_read')}
              </Link>
              <Link href="/e-learning" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 gap-2 border-[#f6efe0]/30 bg-white/5 px-7 font-lato text-base font-semibold text-[#f6efe0] hover:bg-white/10 hover:text-[#f6efe0] dark:border-[#f6efe0]/30 dark:bg-white/5')}>
                <PlayCircle className="size-5 text-primary" /> {t('hero.elearning_cta')}
              </Link>
            </div>
            <p className="kls-rise mt-4 font-lato text-sm" style={{ '--kls-delay': '0.35s' } as React.CSSProperties}>
              <Link
                href={isAuthenticated && user ? accountHomeFor(user.role) : '/auth/register'}
                className={cn('font-semibold underline-offset-4 hover:text-primary hover:underline', PARCHMENT)}
              >
                {isAuthenticated && user ? t('hero.go_account') : t('hero.cta_join')} →
              </Link>
            </p>

            {totals.length > 0 && (
              <dl className="kls-rise mx-auto mt-10 flex max-w-md justify-center divide-x divide-[#f6efe0]/15 border-t border-[#f6efe0]/15 pt-6 lg:mx-0 lg:justify-start" style={{ '--kls-delay': '0.45s' } as React.CSSProperties}>
                {totals.map((s) => (
                  <div key={s.label} className="flex-1 px-4 first:pl-0 last:pr-0">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className={cn('font-cinzel text-2xl font-bold sm:text-3xl', PARCHMENT)}>{s.value.toLocaleString('en')}</dd>
                    <dd className={cn('mt-0.5 font-lato text-xs uppercase tracking-wider', PARCHMENT_SOFT)}>{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* The two newest books and today's wisdom, each in its own room; they take turns in the big tile. */}
          <div className="kls-rise relative mx-auto w-full max-w-[600px] pb-8 lg:pl-6" style={{ '--kls-delay': '0.2s' } as React.CSSProperties}>
            <HeroRooms books={books} />
          </div>
        </div>
      </section>

      {/* Library · E-Learning · Publishing */}
      <section className="bg-background px-4 pb-16 pt-20 lg:pt-24">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-center font-lato text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {t('hero.paths_title')}
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {paths.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-muted">
                  <Image
                    src={p.image}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#12304a]/70 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg [&_svg]:size-5">{p.icon}</span>
                </span>
                <span className="flex flex-1 flex-col p-6">
                  <span className="font-cinzel text-lg font-bold text-foreground">{p.title}</span>
                  <span className="mt-2 flex-1 font-lato text-sm leading-relaxed text-muted-foreground">{p.body}</span>
                  <span className="mt-5 inline-flex items-center gap-1.5 font-lato text-sm font-semibold text-[#12304a] dark:text-primary">
                    {p.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
