'use client'

import { Lock } from 'lucide-react'
import { UniversalButton } from '@/components/ui/universal-button'
import type { BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'

interface LockedChapterPaywallProps {
  bookTitle: string
  priceRwf: number
  onBuyAction: (action: BuyAction) => void
}

/** Extracted from reader-view.tsx to keep it under the 200-line ceiling — the free-preview-exhausted paywall shown in place of a locked chapter's body. */
export function LockedChapterPaywall({ bookTitle, priceRwf, onBuyAction }: LockedChapterPaywallProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0', textAlign: 'center' }}>
      <Lock size={28} color="var(--text-muted)" />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360 }}>
        You&apos;ve reached the end of the free preview. Buy or rent &ldquo;{bookTitle}&rdquo; to keep reading.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <UniversalButton variant="gold" size="sm" onClick={() => onBuyAction('SALE')}>
          Buy — {priceRwf.toLocaleString()} RWF
        </UniversalButton>
        <UniversalButton variant="gold-outline" size="sm" onClick={() => onBuyAction('RENTAL')}>
          Rent
        </UniversalButton>
      </div>
    </div>
  )
}
