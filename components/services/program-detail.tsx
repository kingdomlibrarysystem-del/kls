'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import { serviceColor, type LifeAreaItem, type ServiceProgramItem } from '@/lib/services/shared'
import { ServiceIcon } from '@/components/services/service-icon'
import { LifeCycle } from './life-cycle'
import { OfferingPicker } from './offering-picker'
import { ServiceProducts } from './service-products'
import type { ShopProduct } from '@/lib/shop/shared'

interface Props {
  program: ServiceProgramItem
  others: ServiceProgramItem[]
  areas: LifeAreaItem[]
  basePath?: string
  /** Signed out: member-only buttons go through sign-in and come back. */
  signedIn: boolean
  /** Products from the shop categories linked to this programme (and picked on its sub-services). */
  products?: ShopProduct[]
  categories?: { id: string; name: string }[]
  /** /shop or /member/shop. */
  shopPath?: string
}

/** One programme: what it is, its key services, the button into the real feature, the life areas it supports and the other programmes. */
export function ProgramDetail({ program, others, areas, basePath = '/services', signedIn, products = [], categories = [], shopPath = '/shop' }: Props) {
  const { t } = useLanguage()
  const c = serviceColor(program.color)
  const cta = program.ctaHref
    ? (!signedIn && program.ctaHref.startsWith('/member') ? `/auth/login?redirect=${encodeURIComponent(program.ctaHref)}` : program.ctaHref)
    : null

  return (
    <div className="space-y-10">
      <Link href={basePath} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {t('services.back')}</Link>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className={`flex flex-wrap items-center gap-4 px-6 py-6 sm:px-8 ${c.solid}`}>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/60"><ServiceIcon name={program.icon} className="size-7" /></span>
          <div className="min-w-0">
            <h1 className="font-cinzel text-2xl font-bold uppercase tracking-wide sm:text-3xl">{program.name}</h1>
            <p className="mt-1 italic opacity-90">{program.tagline}</p>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            <p className="text-base leading-relaxed text-foreground">{program.description}</p>
            {/* Programmes not yet split into sub-services still show their plain list. */}
            {program.offerings.length === 0 && program.keyServices.length > 0 && (
              <div>
                <h2 className={`text-sm font-bold uppercase tracking-wide ${c.text}`}>{t('services.key_services')}</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {program.keyServices.map((s) => (
                    <li key={s} className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${c.soft}`}><Check className="mt-0.5 size-4 shrink-0" aria-hidden /> {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {cta && (
              <Link href={cta} className={buttonVariants({ size: 'lg' })}>
                {program.ctaLabel || t('services.get_started')} <ArrowRight />
              </Link>
            )}
          </div>
          <div className="relative min-h-56 overflow-hidden rounded-xl bg-muted">
            {program.image
              ? <RemoteImage src={program.image} alt={program.name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" fallback={<div className={`flex size-full items-center justify-center ${c.soft}`}><ServiceIcon name={program.icon} className="size-20" /></div>} />
              : <div className={`flex size-full min-h-56 items-center justify-center ${c.soft}`}><ServiceIcon name={program.icon} className="size-20 opacity-80" /></div>}
          </div>
        </div>
        {areas.length > 0 && <div className={`px-6 py-2 text-center text-sm font-semibold ${c.solid}`}>{t('services.supports_areas').replace('{n}', String(areas.length))}</div>}
      </article>

      <OfferingPicker program={program} basePath={basePath} signedIn={signedIn} />

      <ServiceProducts products={products} categories={categories} shopPath={shopPath} />

      <LifeCycle areas={areas} compact />

      {others.length > 0 && (
        <section>
          <h2 className="font-cinzel text-lg font-bold uppercase text-foreground">{t('services.other_programs')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => {
              const oc = serviceColor(o.color)
              return (
                <Link key={o.id} href={`${basePath}/${o.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition hover:shadow-md">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${oc.solid}`}><ServiceIcon name={o.icon} className="size-5" /></span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{o.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{o.tagline}</span>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
