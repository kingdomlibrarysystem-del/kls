import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ScheduleView } from './_components/schedule-view'

export default function RehabSchedulePage() {
  return (
    <PageTransition>
      <PageHeader title="Program Schedule" subtitle="Your scheduled rehabilitation sessions and check-ins" />
      <ScheduleView />
    </PageTransition>
  )
}
