'use client'

import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { InviteForm } from './_components/invite-form'
import { InvitationsTable } from './_components/invitations-table'
import { InvitationsStats } from './_components/invitations-stats'
import { useInvitations, addInvitation, updateInvitation, removeInvitation } from './_components/use-invitations'

/**
 * Invitations page. Reads from the shared invitations store so the invite
 * form and the table stay in sync with each other and survive a route
 * remount, instead of resetting to the seed data every time.
 */
export default function InvitationsPage() {
  const invitations = useInvitations()

  return (
    <PageTransition>
      <PageHeader title="Invitations" subtitle="Invite new users and track invitation status" />
      <InvitationsStats invitations={invitations} />
      <InviteForm onInvited={addInvitation} />
      <div className="mt-8">
        <InvitationsTable invitations={invitations} onUpdateInvitation={updateInvitation} onRemoveInvitation={removeInvitation} />
      </div>
    </PageTransition>
  )
}
