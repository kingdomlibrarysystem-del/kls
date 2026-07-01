import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ProgressView } from './_components/progress-view'

export default function ProgressPage() {
  return (
    <PageTransition>
      <PageHeader title="My Progress" subtitle="Completion rates, top performers, and dropoff points per course" />
      <ProgressView />
    </PageTransition>
  )
}
