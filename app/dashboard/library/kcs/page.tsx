import { Suspense } from 'react'
import { PageTransition } from '@/components/ui/page-transition'
import { LibraryTabs } from '../_components/library-tabs'
import { KcsMapView } from './_components/kcs-map-view'

/** KCS Map tab of the Digital Library admin section — categories are a library concept, so this lives under /dashboard/library instead of its own top-level sidebar entry. See LibraryTabs for the shared tab bar with Book Inventory. */
export default function KcsMapPage() {
  return (
    <PageTransition>
      <LibraryTabs active="kcs-map" />
      <Suspense>
        <KcsMapView />
      </Suspense>
    </PageTransition>
  )
}
