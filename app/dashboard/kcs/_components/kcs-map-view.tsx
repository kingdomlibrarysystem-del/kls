'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getRootCategories, getCategoryById } from '@/lib/kcs-taxonomy'
import { KcsPillarView } from './kcs-pillar-view'
import { KcsTaxonomyAnalytics } from './kcs-taxonomy-analytics'
import { ManageCategoriesSection } from './manage-categories-section'

const DEFAULT_PILLAR_SLUG = getRootCategories()[0].slug

/**
 * Client wrapper resolving the active pillar from the `?pillar=` search
 * param (so the tab bar's selection is a real, shareable/back-button-able
 * URL state, and the scroll-detail page's "Back to {pillar}" link can
 * target a specific tab) — replaces the previous 8 separate route files
 * (foundation/page.tsx, history/page.tsx, etc.), all of which rendered the
 * exact same KcsPillarView with only the pillarKey literal differing.
 *
 * The pillar is identified by its `slug` (e.g. "kcs-fnd") — the canonical
 * `Category.slug` already exists and is stable, so it's reused as the route
 * param instead of inventing a separate `key` field.
 *
 * Below the pillar browsing UI: a whole-taxonomy analytics summary, then a
 * real "Manage Categories" CRUD section — the former standalone
 * `/dashboard/library/categories` admin page, absorbed here since KCS Map
 * is now the single home for both browsing and managing this taxonomy.
 */
export function KcsMapView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramPillar = searchParams.get('pillar')
  const [pillarSlug, setPillarSlug] = useState(
    paramPillar && getCategoryById(paramPillar) ? paramPillar : DEFAULT_PILLAR_SLUG
  )

  const handlePillarChange = (next: string) => {
    setPillarSlug(next)
    router.replace(`/dashboard/kcs?pillar=${next}`, { scroll: false })
  }

  return (
    <div>
      <KcsTaxonomyAnalytics />
      <KcsPillarView pillarSlug={pillarSlug} onPillarChange={handlePillarChange} />
      <ManageCategoriesSection />
    </div>
  )
}
