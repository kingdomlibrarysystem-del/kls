'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { InviteForm } from './_components/invite-form'
import { InvitationsTable } from './_components/invitations-table'
import { mockInvitations, type Invitation } from './_components/invitations-data'

/**
 * Invitations page. Owns the invitation list so the invite form and the
 * table are no longer disconnected siblings — a new invitation appends
 * here and is immediately visible in the table below.
 */
export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations)

  return (
    <PageTransition>
      <PageHeader title="Invitations" subtitle="Invite new users and track invitation status" />
      <InviteForm onInvited={(invitation) => setInvitations((prev) => [invitation, ...prev])} />
      <div className="mt-8">
        <InvitationsTable invitations={invitations} onUpdateInvitation={(updated) =>
          setInvitations((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)))
        } onRemoveInvitation={(id) =>
          setInvitations((prev) => prev.filter((inv) => inv.id !== id))
        } />
      </div>
    </PageTransition>
  )
}
