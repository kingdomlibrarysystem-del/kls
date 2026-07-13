import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function HistoryPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="history" />
    </PageTransition>
  )
}
