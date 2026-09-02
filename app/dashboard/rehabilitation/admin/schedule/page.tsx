import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ScheduleTable } from './_components/schedule-table'

export default function RehabScheduleAdminPage() {
  return (
    <PageTransition>
      <PageHeader title="Program Schedule" subtitle="Schedule sessions and manage the program calendar" />
      <ScheduleTable />
    </PageTransition>
  )
}
