'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { kcsPillars } from './kcs-pillars-data'
import { KcsPillarView } from './kcs-pillar-view'

const DEFAULT_PILLAR = 'foundation'

/**
 * Client wrapper resolving the active pillar from the `?pillar=` search
 * param (so the tab bar's selection is a real, shareable/back-button-able
 * URL state, and the scroll-detail page's "Back to {pillar}" link can
 * target a specific tab) — replaces the previous 8 separate route files
 * (foundation/page.tsx, history/page.tsx, etc.), all of which rendered the
 * exact same KcsPillarView with only the pillarKey literal differing.
 */
export function KcsMapView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramPillar = searchParams.get('pillar')
  const [pillarKey, setPillarKey] = useState(paramPillar && kcsPillars[paramPillar] ? paramPillar : DEFAULT_PILLAR)

  const handlePillarChange = (next: string) => {
    setPillarKey(next)
    router.replace(`/dashboard/kcs?pillar=${next}`, { scroll: false })
  }

  return <KcsPillarView pillarKey={pillarKey} onPillarChange={handlePillarChange} />
}
