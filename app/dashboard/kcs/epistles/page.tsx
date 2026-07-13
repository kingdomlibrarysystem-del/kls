import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function EpistlesPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="epistles" />
    </PageTransition>
  )
}
