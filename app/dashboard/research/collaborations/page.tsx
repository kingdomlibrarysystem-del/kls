import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { CollaborationsView } from './_components/collaborations-view'

export default function CollaborationsPage() {
  return (
    <PageTransition>
      <PageHeader title="Collaborations" subtitle="Research projects and their contributors" />
      <CollaborationsView />
    </PageTransition>
  )
}
