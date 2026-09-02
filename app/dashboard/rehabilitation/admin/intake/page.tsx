import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { IntakeTable } from './_components/intake-table'

export default function RehabIntakeAdminPage() {
  return (
    <PageTransition>
      <PageHeader title="Intake Review" subtitle="All member intake submissions — review, create a plan, or decline" />
      <IntakeTable />
    </PageTransition>
  )
}
