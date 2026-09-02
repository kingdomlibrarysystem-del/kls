import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { IntakeView } from './_components/intake-view'

export default function RehabIntakePage() {
  return (
    <PageTransition>
      <PageHeader title="Intake & Assessment" subtitle="Complete an initial assessment to build a personalized recovery plan" />
      <IntakeView />
    </PageTransition>
  )
}
