import { PageTransition } from '@/components/ui/page-transition'
import { KcsPillarView } from '../_components/kcs-pillar-view'

export default function WisdomPage() {
  return (
    <PageTransition>
      <KcsPillarView pillarKey="wisdom" />
    </PageTransition>
  )
}
