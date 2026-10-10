'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, GraduationCap, BookCopy, ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { accountHomeFor } from '@/components/profile-dropdown'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { cn } from '@/lib/utils'
import { LibraryArt, ELearningArt, PublishingArt } from './hero-path-art'

/** How long each hero picture stays before the next one fades in. */
const HERO_SLIDE_MS = 7000

/**
 * The hero's pictures, shown one at a time. The first is the original
 * transparent photo, which keeps turning slowly; the other two are upright
 * (2:3) photos that simply fade in (no rotation), each in a rounded frame of
 * its own shape. A replacement photo should also be 2:3 upright.
 */
const HERO_SLIDES = [
  { src: '/hero-img1.png', alt: 'People praying together around a table with open Bibles', kind: 'spin' },
  { src: '/hero-img2.jpg', alt: 'A reader with an open book by a window at sunset', kind: 'photo' },
  { src: '/hero-img3.jpg', alt: 'A woman praying beside a Holy Bible', kind: 'photo' },
] as const

interface HeroSectionProps {
  /** Real book covers (trending books) for the Library card's fanned covers. */
  bookCovers?: string[]
  /** Course cover images for the E-Learning card's lesson tiles. */
  courseImages?: string[]
}

/**
 * Landing hero. One message instead of the old auto-rotating 3-slide
 * carousel: the app exists to get people reading the Bible, so the first
 * screen says that, offers one primary action ("Start reading" -> /library)
 * and one secondary (create an account, or "My Account" when signed in).
 * The three former slides (Library / E-Learning / Publishing & Research)
 * are kept as three always-visible cards underneath, with their existing
 * translated copy and links. Each card has a soft tinted gradient and a
 * small image cluster in its top-right corner (see hero-path-art.tsx).
 */
export function HeroSection({ bookCovers = [], courseImages = [] }: HeroSectionProps) {
  const { t } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const [slide, setSlide] = useState(0)

  // Advance the hero picture on a timer (browser-only, so an effect is the right tool).
  useEffect(() => {
    const id = setInterval(() => setSlide((i) => (i + 1) % HERO_SLIDES.length), HERO_SLIDE_MS)
    return () => clearInterval(id)
  }, [])

  // Per-card tint: card gradient + icon chip + CTA color (theme tokens, so light and dark both work).
  const paths = [
    {
      icon: <BookOpen />, title: t('hero.library_tag'), body: t('hero.library_body'), cta: t('hero.library_cta'), href: '/library',
      art: <LibraryArt covers={bookCovers} />,
      card: 'to-primary/15 hover:border-primary/50', chip: 'bg-primary/15 text-primary', link: 'text-primary',
    },
    {
      icon: <GraduationCap />, title: t('hero.elearning_tag'), body: t('hero.elearning_body'), cta: t('hero.elearning_cta'), href: '/member/e-learning',
      art: <ELearningArt images={courseImages} />,
      card: 'to-info/15 hover:border-info/50', chip: 'bg-info/15 text-info', link: 'text-info',
    },
    {
      icon: <BookCopy />, title: t('hero.publishing_tag'), body: t('hero.publishing_body'), cta: t('hero.publishing_cta'), href: '/auth/register',
      art: <PublishingArt cover={bookCovers[0] ?? '/images/book-B.jpg'} />,
      card: 'to-success/15 hover:border-success/50', chip: 'bg-success/15 text-success', link: 'text-success',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fdf8ef] to-white dark:from-[#111828] dark:to-[#0a0d1a]">
      {/* Decorative glows */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-24 size-[360px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pt-10 lg:pb-16 lg:pt-12">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          {/* Message */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 font-lato text-xs font-semibold uppercase tracking-widest text-primary">
              {t('hero.eyebrow')}
            </span>

            <h1 className="mt-5 font-cinzel text-xl font-bold leading-[1.12] text-foreground sm:text-2xl lg:text-3xl">
              {t('hero.title_1')}{' '}
              <span className="text-primary">{t('hero.title_2')}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl font-lato text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/library" className={cn(buttonVariants(), 'h-12 w-full gap-2 px-7 font-lato text-base font-bold shadow-md sm:w-auto')}>
                <BookOpen className="size-5" /> {t('hero.cta_read')}
              </Link>
           
            </div>
          </div>

          {/* Visual: three pictures shown one after another. Each fades in with a slight
              zoom and the previous one fades out. Only the first (the transparent photo of
              people praying around a table) turns slowly; the other two just appear. The
              box keeps the first picture's proportions so the row height never jumps.
              Motion is switched off for visitors who ask their device for reduced motion. */}
          <div className="relative mx-auto aspect-[1503/1046] w-full max-w-[360px] sm:max-w-[500px] lg:max-w-[620px]">
            <div aria-hidden className="absolute inset-x-16 inset-y-2 rounded-full bg-primary/15 blur-3xl" />
            {HERO_SLIDES.map((item, i) => {
              const active = i === slide
              return (
                <div
                  key={item.src}
                  aria-hidden={!active}
                  className={cn(
                    'absolute inset-0 transition-all duration-1000 ease-out motion-reduce:transition-none',
                    active ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
                  )}
                >
                  {item.kind === 'spin' ? (
                    // A small scale-up fills the PNG's transparent margins (on this wrapper,
                    // because the image itself carries the rotation).
                    <div className="absolute inset-0 scale-[1.12] lg:scale-[1.18]">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        priority
                        sizes="(max-width: 640px) 420px, (max-width: 1024px) 580px, 740px"
                        className="animate-[spin_90s_linear_infinite] object-contain drop-shadow-2xl motion-reduce:animate-none"
                      />
                    </div>
                  ) : (
                    // Both photos are upright (2:3). The frame takes the PHOTO's own shape —
                    // a little taller than the box, centered — so the whole picture is visible:
                    // nothing is cropped and there are no empty bars beside it.
                    <div className="absolute -inset-y-6 left-1/2 aspect-[2/3] -translate-x-1/2 lg:-inset-y-10 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        sizes="(max-width: 640px) 200px, (max-width: 1024px) 270px, 350px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Which picture is showing; tap a dot to jump to it. */}
            <div className="absolute -bottom-12 left-1/2 flex -translate-x-1/2 gap-2 lg:-bottom-16">
              {HERO_SLIDES.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Show picture ${i + 1} of ${HERO_SLIDES.length}`}
                  aria-current={i === slide}
                  className={cn('h-1.5 rounded-full transition-all', i === slide ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30 hover:bg-primary/60')}
                />
              ))}
            </div>
          </div>
        </div>

        {/* The three former slides, now always visible */}
        <div className="mt-14 lg:mt-20">
          <p className="mb-4 text-center font-lato text-xs font-semibold uppercase tracking-widest text-muted-foreground lg:text-left">
            {t('hero.paths_title')}
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {paths.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md",
                  p.card,
                )}
              >
                {/* Corner artwork (decorative) */}
                {p.art}
                {/* Icon + title share the top band with the artwork; pr keeps the title clear of it. */}
                <span className="flex min-h-[92px] flex-col pr-32">
                  <span className={cn("flex size-10 items-center justify-center rounded-lg [&_svg]:size-5", p.chip)}>{p.icon}</span>
                  <span className="mt-3 font-cinzel text-base font-bold text-foreground">{p.title}</span>
                </span>
                <span className="mt-1.5 flex-1 font-lato text-sm leading-relaxed text-muted-foreground">{p.body}</span>
                <span className={cn("mt-4 inline-flex items-center gap-1.5 font-lato text-sm font-semibold", p.link)}>
                  {p.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
