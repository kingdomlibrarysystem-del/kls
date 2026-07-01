import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function FoundationPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="foundation" />
    </PageTransition>
  )
}
