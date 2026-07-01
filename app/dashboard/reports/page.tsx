import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { ReportsView } from './_components/reports-view'

export default function ReportsPage() {
  return (
    <PageTransition>
      <PageHeader title="Reports & Analytics" subtitle="Cross-module trends and platform-wide statistics" />
      <ReportsView />
    </PageTransition>
  )
}
