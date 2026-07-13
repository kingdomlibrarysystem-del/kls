import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { SessionsView } from './_components/sessions-view'

export default function AdminSessionsPage() {
  return (
    <PageTransition>
      <PageHeader title="Live Sessions" subtitle="All session requests across every lecturer and course" />
      <SessionsView />
    </PageTransition>
  )
}
