'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { serviceColor, type ServiceOfferingItem, type ServiceProgramItem } from '@/lib/services/shared'
import { ChannelIcon } from './channel-icon'
import { RequestServiceDialog } from './request-service-dialog'

interface Props {
  program: ServiceProgramItem
  basePath: string
  signedIn: boolean
}

/**
 * The programme's sub-services as cards. Each card opens its own page; the
 * "Select" toggle lets a member pick one or several, and a bar at the bottom
 * of the screen sends them all as one request (call / messages / meeting).
 */
export function OfferingPicker({ program, basePath, signedIn }: Props) {
  const { t } = useLanguage()
  const c = serviceColor(program.color)
  const [picked, setPicked] = useState<string[]>([])
  const [dialog, setDialog] = useState<ServiceOfferingItem[] | null>(null)
  const programHref = `${basePath}/${program.slug}`
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const chosen = program.offerings.filter((o) => picked.includes(o.id))

  if (program.offerings.length === 0) return null

  return (
    <section aria-labelledby="sub-services" className="space-y-3">
      <div>
        <h2 id="sub-services" className={`text-sm font-bold uppercase tracking-wide ${c.text}`}>{t('services.sub_services')}</h2>
        <p className="text-sm text-muted-foreground">{t('services.sub_services_hint')}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {program.offerings.map((o) => {
          const on = picked.includes(o.id)
          return (
            <li key={o.id} className={`flex flex-col gap-2 rounded-xl border-[1.5px] bg-card p-4 shadow-xs transition-colors ${on ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`${programHref}/${o.slug}`} className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline">{o.name}</Link>
                  {o.summary && o.summary !== o.name && <p className="mt-0.5 text-sm text-muted-foreground">{o.summary}</p>}
                </div>
                <button type="button" onClick={() => toggle(o.id)} aria-pressed={on} aria-label={`${on ? t('services.selected') : t('services.select')}: ${o.name}`}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'}`}>
                  {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} {on ? t('services.selected') : t('services.select')}
                </button>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {o.channels.map((ch) => <span key={ch} className="inline-flex items-center gap-1"><ChannelIcon channel={ch} className="size-3.5" /> {t(`services.channel_${ch}`)}</span>)}
                {o.productIds.length > 0 && <span className="inline-flex items-center gap-1"><ShoppingBag className="size-3.5" /> {o.productIds.length}</span>}
                {o.priceNote && <span className="font-medium text-foreground">{o.priceNote}</span>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => setDialog([o])}>{t('services.get_service')}</Button>
                <Link href={`${programHref}/${o.slug}`} className="inline-flex items-center gap-1 px-1 text-sm font-medium text-primary hover:underline">{t('services.view_details')} <ArrowRight className="size-3.5" /></Link>
              </div>
            </li>
          )
        })}
      </ul>

      {chosen.length > 0 && (
        <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-card/95 p-3 shadow-lg backdrop-blur">
          <span className="text-sm font-semibold text-foreground">{t('services.selected_n').replace('{n}', String(chosen.length))}</span>
          <button type="button" onClick={() => setPicked([])} className="text-sm text-muted-foreground hover:text-foreground">{t('services.clear')}</button>
          <Button className="ml-auto" onClick={() => setDialog(chosen)}>{t('services.get_selected')} <ArrowRight /></Button>
        </div>
      )}

      {dialog && (
        <RequestServiceDialog
          key={dialog.map((o) => o.id).join('-')}
          open
          onClose={() => setDialog(null)}
          program={{ id: program.id, name: program.name }}
          offerings={dialog}
          signedIn={signedIn}
          signInHref={`/auth/login?redirect=${encodeURIComponent(programHref)}`}
          onSent={() => setPicked([])}
        />
      )}
    </section>
  )
}
