import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { SessionsView } from './_components/sessions-view'

export default function AdminSessionsPage() {
  return (
    <PageTransition>
      <PageHeader title="Open Classes" subtitle="Live online classes members ask for after finishing a course — confirm a time, then teach in the class room" />
      <SessionsView />
    </PageTransition>
  )
}
