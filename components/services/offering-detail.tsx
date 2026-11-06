'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import { serviceColor, type ServiceOfferingItem, type ServiceProgramItem } from '@/lib/services/shared'
import type { ShopProduct } from '@/lib/shop/shared'
import { ChannelIcon } from './channel-icon'
import { RequestServiceDialog } from './request-service-dialog'
import { ServiceIcon } from './service-icon'
import { ServiceProducts } from './service-products'

interface Props {
  program: ServiceProgramItem
  offering: ServiceOfferingItem
  products: ShopProduct[]
  /** Shop categories linked to the programme (for "see all in the shop"). */
  categories: { id: string; name: string }[]
  /** /services (guests) or /member/services. */
  basePath: string
  /** /shop or /member/shop — where product cards lead. */
  shopPath: string
  signedIn: boolean
}

/**
 * One sub-service: what it is, how we can help (phone call / messages /
 * online meeting), "Get this service", the shop products that go with it,
 * and the programme's other sub-services.
 */
export function OfferingDetail({ program, offering, products, categories, basePath, shopPath, signedIn }: Props) {
  const { t } = useLanguage()
  const c = serviceColor(program.color)
  const [open, setOpen] = useState(false)
  const programHref = `${basePath}/${program.slug}`
  const others = program.offerings.filter((o) => o.id !== offering.id)

  return (
    <div className="space-y-10">
      <Link href={programHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {program.name}</Link>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className={`flex flex-wrap items-center gap-4 px-6 py-5 sm:px-8 ${c.solid}`}>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/60"><ServiceIcon name={program.icon} className="size-6" /></span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{program.name}</p>
            <h1 className="font-cinzel text-xl font-bold leading-tight sm:text-2xl">{offering.name}</h1>
          </div>
        </div>

        <div className={`grid gap-8 p-6 sm:p-8 ${offering.image ? 'lg:grid-cols-[1.2fr_1fr]' : ''}`}>
          <div className="space-y-5">
            {offering.summary !== offering.name && <p className="text-lg text-foreground">{offering.summary}</p>}
            {offering.description && <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{offering.description}</p>}
            {offering.priceNote && <p className="text-sm"><span className="text-muted-foreground">{t('services.price')}:</span> <span className="font-semibold text-foreground">{offering.priceNote}</span></p>}

            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wide ${c.text}`}>{t('services.how_talk')}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {offering.channels.map((ch) => (
                  <li key={ch} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><ChannelIcon channel={ch} className="size-4 text-primary" /> {t(`services.channel_${ch}`)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(`services.channel_${ch}_hint`)}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => setOpen(true)}>{t('services.get_service')} <ArrowRight /></Button>
              {products.length > 0 && <a href="#products" className={buttonVariants({ variant: 'outline', size: 'lg' })}><ShoppingBag /> {t('services.products_title')}</a>}
            </div>
          </div>
          {offering.image && (
            <div className="relative min-h-56 overflow-hidden rounded-xl bg-muted">
              <RemoteImage src={offering.image} alt={offering.name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" fallback={<div className={`size-full ${c.soft}`} />} />
            </div>
          )}
        </div>
      </article>

      <ServiceProducts products={products} categories={categories} shopPath={shopPath} />

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cinzel text-lg font-bold uppercase text-foreground">{t('services.other_sub').replace('{program}', program.name)}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <li key={o.id}>
                <Link href={`${programHref}/${o.slug}`} className="flex h-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground shadow-xs transition hover:border-primary/50">
                  <span className="min-w-0">{o.name}</span><ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RequestServiceDialog
        open={open}
        onClose={() => setOpen(false)}
        program={{ id: program.id, name: program.name }}
        offerings={[offering]}
        signedIn={signedIn}
        signInHref={`/auth/login?redirect=${encodeURIComponent(`${programHref}/${offering.slug}`)}`}
      />
    </div>
  )
}
