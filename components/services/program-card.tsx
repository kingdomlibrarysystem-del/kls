'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import { serviceColor, type ServiceProgramItem } from '@/lib/services/shared'
import { ServiceIcon } from '@/components/services/service-icon'

interface Props {
  program: ServiceProgramItem
  /** Number of life areas, for "Supports all N areas of life". */
  areaCount: number
  /** Base path of the detail page: /services (guests) or /member/services (members). */
  basePath?: string
}

/**
 * One programme card in the overview's style: coloured header band with the
 * icon, a photo (or a tinted icon panel when none is uploaded), the key
 * services checklist, and the "supports all areas of life" footer band.
 * The whole card leads to the programme's page.
 */
export function ProgramCard({ program, areaCount, basePath = '/services' }: Props) {
  const { t } = useLanguage()
  const c = serviceColor(program.color)
  const href = `${basePath}/${program.slug}`

  return (
    <Link href={href} className={`group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs ring-0 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 ${c.ring}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${c.solid}`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/60"><ServiceIcon name={program.icon} className="size-5" /></span>
        <div className="min-w-0">
          <h3 className="font-cinzel text-base font-bold uppercase leading-tight tracking-wide">{program.name}</h3>
          <p className="text-xs italic leading-snug opacity-90">{program.tagline}</p>
        </div>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {program.image ? (
          <RemoteImage src={program.image} alt={program.name} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" fallback={<IconPanel name={program.icon} soft={c.soft} />} />
        ) : (
          <IconPanel name={program.icon} soft={c.soft} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className={`text-sm font-bold ${c.text}`}>{t('services.key_services')}</p>
        <ul className="space-y-1.5">
          {program.keyServices.map((s) => (
            <li key={s} className="flex items-start gap-2 text-sm text-foreground">
              <Check className={`mt-0.5 size-4 shrink-0 ${c.text}`} aria-hidden /> <span>{s}</span>
            </li>
          ))}
        </ul>
        <span className={`mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold ${c.text}`}>
          {t('services.learn_more')} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>

      {areaCount > 0 && (
        <div className={`px-4 py-2 text-center text-sm font-semibold ${c.solid}`}>{t('services.supports_areas').replace('{n}', String(areaCount))}</div>
      )}
    </Link>
  )
}

function IconPanel({ name, soft }: { name: string; soft: string }) {
  return (
    <div className={`flex size-full items-center justify-center ${soft}`}>
      <ServiceIcon name={name} className="size-16 opacity-80" />
    </div>
  )
}
