'use client'

import Image from 'next/image'
import { Target, Users, HeartHandshake, BookMarked } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

const pillars = [
  { icon: Target, key: 'p1' },
  { icon: Users, key: 'p2' },
  { icon: HeartHandshake, key: 'p3' },
]

/**
 * About Us on the landing page (the footer "About Us" link opens #about).
 * A deep navy band like the header and hero: real photos of the
 * community reading together on one side, the label, headline, a few
 * sentences and three short points on the other.
 */
export function AboutSection() {
  const { t } = useLanguage()

  return (
    <section id="about" className="relative scroll-mt-28 overflow-hidden bg-[#12304a] px-4 py-20 lg:py-24 dark:bg-[#080b16]">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 size-[520px] rounded-full bg-[#2a5f8f]/45 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Photos: the community reading together, with a smaller classroom photo in front. */}
        <div className="relative mx-auto w-full max-w-[520px] pb-10 pr-10 sm:pb-14 sm:pr-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-[#f6efe0]/10">
            <Image src="/home/church-group-reading.jpg" alt="Believers reading their Bibles together in church" fill sizes="(max-width: 1024px) 90vw, 460px" className="object-cover" />
          </div>
          <div className="absolute bottom-0 right-0 aspect-[4/3] w-1/2 overflow-hidden rounded-2xl border-4 border-[#12304a] shadow-2xl dark:border-[#080b16]">
            <Image src="/home/classroom-reading.jpg" alt="A teacher reading with children in a classroom" fill sizes="260px" className="object-cover" />
          </div>
        </div>

        <div className="text-center lg:text-left">
          <span className="font-lato text-xs font-bold uppercase tracking-[0.25em] text-primary">{t('about.label')}</span>
          <h2 className="mt-3 font-cinzel text-3xl font-bold text-[#f6efe0] md:text-4xl" style={{ letterSpacing: '1.5px' }}>
            {t('about.title')}
          </h2>
          <p className="mt-4 font-cormorant text-xl leading-relaxed text-[#f6efe0]/80">{t('about.body')}</p>

          <ul className="mt-8 space-y-4 text-left">
            {pillars.map(({ icon: Icon, key }) => (
              <li key={key} className="flex gap-4 rounded-xl border border-[#f6efe0]/10 bg-white/[0.04] p-4 transition-colors hover:border-primary/40">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block font-cinzel font-semibold text-[#f6efe0]">{t(`about.${key}_title`)}</span>
                  <span className="mt-1 block font-lato text-sm leading-relaxed text-[#f6efe0]/65">{t(`about.${key}_body`)}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-center justify-center gap-2 font-lato text-sm text-[#f6efe0]/65 lg:justify-start">
            <BookMarked size={15} className="text-primary" />
            {t('about.signoff')}
          </p>
        </div>
      </div>
    </section>
  )
}
