import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function GospelPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="gospel" />
    </PageTransition>
  )
}
