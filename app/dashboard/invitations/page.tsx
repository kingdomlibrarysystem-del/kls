import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { InviteForm } from './_components/invite-form'
import { InvitationsTable } from './_components/invitations-table'

export default function InvitationsPage() {
  return (
    <PageTransition>
      <PageHeader title="Invitations" subtitle="Invite new users and track invitation status" />
      <InviteForm />
      <div className="mt-8">
        <InvitationsTable />
      </div>
    </PageTransition>
  )
}
