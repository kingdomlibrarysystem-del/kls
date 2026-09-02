import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { SessionsView } from './_components/sessions-view'

export default function CounselingSessionsPage() {
  return (
    <PageTransition>
      <PageHeader title="Book a Session" subtitle="Request a confidential consultation with an accredited counselor" />
      <SessionsView />
    </PageTransition>
  )
}
