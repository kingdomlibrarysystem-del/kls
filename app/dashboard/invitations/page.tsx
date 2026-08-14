'use client'

import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { InviteForm } from './_components/invite-form'
import { InvitationsTable } from './_components/invitations-table'
import { InvitationsStats } from './_components/invitations-stats'
import { useInvitations } from './_components/use-invitations'

/** Invitations page: real /api/invitations-backed form + table, kept in sync via a shared fetch hook. */
export default function InvitationsPage() {
  const { invitations, loading, addInvitation, resendInvitation, removeInvitation } = useInvitations()

  return (
    <PageTransition>
      <PageHeader title="Invitations" subtitle="Invite new users and track invitation status" />
      <InvitationsStats invitations={invitations} />
      <InviteForm onInvite={addInvitation} />
      <div className="mt-8">
        <InvitationsTable invitations={invitations} loading={loading} onResendInvitation={resendInvitation} onRemoveInvitation={removeInvitation} />
      </div>
    </PageTransition>
  )
}
