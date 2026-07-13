import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function ActsPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="acts" />
    </PageTransition>
  )
}
