'use client'

import { ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { serviceColor, type LifeAreaItem } from '@/lib/services/shared'
import { ServiceIcon } from '@/components/services/service-icon'

/**
 * "The Life Cycle": the numbered areas in order. Always a wrapping grid —
 * 2 per row on phones, 3 on tablets, 6 on wide screens — so any number of
 * areas fits without pushing the page sideways. On wide screens an arrow
 * joins each area to the next one on the same row. Names sit under the
 * circle (and wrap) instead of being squeezed inside it.
 */
export function LifeCycle({ areas, compact = false }: { areas: LifeAreaItem[]; compact?: boolean }) {
  const { t } = useLanguage()
  if (areas.length === 0) return null
  return (
    <section aria-labelledby="life-cycle-title" className="text-center">
      <h2 id="life-cycle-title" className="font-cinzel text-xl font-bold uppercase tracking-wide text-foreground sm:text-2xl">{t('services.life_cycle_title')}</h2>
      <p className="mt-1 text-sm italic text-muted-foreground">{t('services.life_cycle_sub')}</p>
      <ol className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {areas.map((a, i) => {
          const c = serviceColor(a.color)
          // Arrow to the next area only when it is on the same 6-wide row.
          const arrow = i < areas.length - 1 && (i + 1) % 6 !== 0
          return (
            <li key={a.id} className="relative flex min-w-0 flex-col items-center gap-2 px-1">
              <div className="relative">
                <span className={`flex items-center justify-center rounded-full shadow-md ${c.solid} ${compact ? 'size-16' : 'size-20 sm:size-24'}`}>
                  <ServiceIcon name={a.icon} className={compact ? 'size-6' : 'size-7 sm:size-9'} />
                </span>
                <span className={`absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background text-xs font-bold ${c.solid}`}>{i + 1}</span>
              </div>
              <p className={`max-w-full break-words font-bold uppercase leading-tight ${c.text} ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>{a.name}</p>
              {!compact && <p className="max-w-[12rem] text-xs leading-snug text-muted-foreground sm:text-sm">{a.description}</p>}
              {arrow && <ChevronRight className={`absolute -right-3 hidden size-5 text-muted-foreground lg:block ${compact ? 'top-5' : 'top-9'}`} aria-hidden />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
