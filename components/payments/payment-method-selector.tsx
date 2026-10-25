'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { CreditCard, Smartphone } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { PaymentMethodCode, PaymentOption } from '@/lib/payments/shared'

const MTN_LOGO = 'https://res.cloudinary.com/kapkga1t/image/upload/v1788259785/mtn.jpg'
const AIRTEL_LOGO = 'https://res.cloudinary.com/kapkga1t/image/upload/v1788252601/air.png'
const CARD_LOGO = 'https://res.cloudinary.com/kapkga1t/image/upload/v1788252882/card.jpg'

/** Which brand logos go with a method (real third-party branding, not app colours). */
function logosFor(o: PaymentOption): { src: string; alt: string }[] {
  if (o.kind === 'redirect') return [{ src: CARD_LOGO, alt: 'Card' }]
  if (o.method === 'MTN_MOMO') return [{ src: MTN_LOGO, alt: 'MTN MoMo' }]
  return [{ src: MTN_LOGO, alt: 'MTN MoMo' }, { src: AIRTEL_LOGO, alt: 'Airtel Money' }]
}

interface Props {
  options: PaymentOption[]
  loading?: boolean
  value: PaymentMethodCode | null
  onChange: (method: PaymentMethodCode, option: PaymentOption) => void
}

/**
 * Payment method cards driven by the admin-managed list
 * (/dashboard/settings/payments) — PayPack, Stripe, InTouch, MTN MoMo,
 * PesaPal, UrubutoPay, whichever are switched on. Selects the first option
 * automatically when nothing (or a no-longer-offered method) is selected.
 */
export function PaymentMethodSelector({ options, loading, value, onChange }: Props) {
  useEffect(() => {
    if (options.length && !options.some((o) => o.method === value)) onChange(options[0].method, options[0])
  }, [options, value, onChange])

  if (loading) return <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
  if (!options.length) {
    return <p className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">Online payment is not available right now. Please try again later.</p>
  }

  return (
    <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-2">
      {options.map((o) => {
        const selected = o.method === value
        return (
          <button
            key={o.method}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.method, o)}
            className={`flex w-full items-center gap-3 rounded-lg border-[1.5px] px-3.5 py-3 text-left transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}
          >
            <span className="flex shrink-0 items-center gap-1.5">
              {logosFor(o).map((l) => (
                <span key={l.alt} className="relative size-10 overflow-hidden rounded-md border border-border bg-white">
                  <Image src={l.src} alt={l.alt} fill sizes="40px" className="object-cover" />
                </span>
              ))}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {o.kind === 'mobile' ? <Smartphone className="size-3.5 text-muted-foreground" /> : <CreditCard className="size-3.5 text-muted-foreground" />}
                {o.label}
              </span>
              {o.description && <span className="block text-xs text-muted-foreground">{o.description}</span>}
            </span>
            <span className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-primary' : 'border-border'}`}>
              {selected && <span className="size-[9px] rounded-full bg-primary" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Phone hint for the selected method. */
export function phonePlaceholder(method: PaymentMethodCode | null): string {
  return method === 'MTN_MOMO' ? '078xxxxxxx (MTN)' : '078xxxxxxx or 073xxxxxxx'
}
