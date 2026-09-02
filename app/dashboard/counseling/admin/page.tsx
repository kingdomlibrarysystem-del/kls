import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CounselingSessionsTable } from './_components/counseling-sessions-table'

export default function CounselingAdminPage() {
  return (
    <PageTransition>
      <PageHeader title="Counseling Sessions" subtitle="All member session requests — confirm, complete, or cancel" />
      <CounselingSessionsTable />
    </PageTransition>
  )
}
