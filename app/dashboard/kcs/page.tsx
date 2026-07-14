import { Suspense } from 'react'
import { PageTransition } from '@/components/ui/page-transition'
import { KcsMapView } from './_components/kcs-map-view'

export default function KcsMapPage() {
  return (
    <PageTransition>
      <Suspense>
        <KcsMapView />
      </Suspense>
    </PageTransition>
  )
}
