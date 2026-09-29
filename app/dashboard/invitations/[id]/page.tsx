import { notFound } from 'next/navigation'
import { requireStaffPage } from '@/lib/server/page-session'
import { getInvitationById } from '@/lib/data/invitations'
import { toPlain } from '@/lib/server/to-plain'
import { InvitationDetailView } from './_components/invitation-detail-view'
import type { Invitation } from '../_components/invitations-data'

interface InvitationDetailPageProps {
  params: Promise<{ id: string }>
}

/** Server-rendered: the invitation is read from the DB during the request, so the page arrives with data instead of a skeleton + client fetch. */
export default async function InvitationDetailPage({ params }: InvitationDetailPageProps) {
  const [{ id }] = await Promise.all([params, requireStaffPage()])
  const invitation = await getInvitationById(id)
  if (!invitation) notFound()
  return <InvitationDetailView initialInvitation={toPlain<Invitation>(invitation)} />
}
