import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ProgressView } from './_components/progress-view'

export default function RehabProgressPage() {
  return (
    <PageTransition>
      <PageHeader title="Progress Tracking" subtitle="Milestones and recovery progress logged by your program staff" />
      <ProgressView />
    </PageTransition>
  )
}
