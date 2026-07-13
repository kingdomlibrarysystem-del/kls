import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function RevelationPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="revelation" />
    </PageTransition>
  )
}
