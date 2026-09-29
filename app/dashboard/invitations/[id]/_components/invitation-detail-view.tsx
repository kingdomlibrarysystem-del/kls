'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Shield, CalendarDays, Hash, ArrowLeft, RefreshCcw, XCircle } from 'lucide-react'
import { UniversalButton } from '@/components/ui/universal-button'
import { LocalDate } from '@/components/ui/local-date'
import { CancelInvitationModal } from '../../_components/cancel-invitation-modal'
import { resendInvitationRequest, removeInvitationRequest } from '../../_components/use-invitations'
import { invitationStatusConfig, type Invitation } from '../../_components/invitations-data'

interface InvitationDetailViewProps {
  /** Loaded on the server by page.tsx — no client fetch, no loading skeleton. */
  initialInvitation: Invitation
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-16 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium break-all" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Details page for a single invitation. The record arrives as a prop from the
 * server page (which 404s when it doesn't exist), so there is no fetch-on-mount.
 * Resend/Cancel call the standalone request helpers instead of useInvitations(),
 * which would download the whole invitation list just to expose two actions.
 */
export function InvitationDetailView({ initialInvitation }: InvitationDetailViewProps) {
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation>(initialInvitation)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState('')

  const handleResend = async () => {
    try {
      await resendInvitationRequest(invitation.id)
      setInvitation({ ...invitation, status: 'PENDING' })
      setToast(`Invitation resent to ${invitation.email}`)
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not resend this invitation — please try again')
    }
  }

  const handleCancel = async () => {
    await removeInvitationRequest(invitation.id)
    router.push('/dashboard/invitations')
  }

  return (
    <div>
      {toast && (
        <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/invitations" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Invitations
        </UniversalButton>
        {invitation.status !== 'ACCEPTED' && (
          <div className="flex gap-2">
            <UniversalButton variant="outline" size="sm" icon={<RefreshCcw size={13} />} onClick={handleResend}>
              Resend
            </UniversalButton>
            <UniversalButton
              variant="destructive"
              size="sm"
              icon={<XCircle size={13} />}
              onClick={() => setCancelling(true)}
            >
              Cancel
            </UniversalButton>
          </div>
        )}
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-cinzel text-xl font-semibold text-w-950 break-all">{invitation.email}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold shrink-0 ${invitationStatusConfig[invitation.status].cls}`}>
            {invitationStatusConfig[invitation.status].label}
          </span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<Mail size={13} />} label="Email" value={invitation.email} />
          <DetailRow icon={<Shield size={13} />} label="Role" value={invitation.role.name} />
          <DetailRow icon={<CalendarDays size={13} />} label="Sent" value={<LocalDate value={invitation.sentAt} />} />
          <DetailRow icon={<Hash size={13} />} label="ID" value={invitation.id} />
        </div>
      </div>

      <CancelInvitationModal
        invitation={cancelling ? invitation : null}
        onClose={() => setCancelling(false)}
        onConfirm={async () => {
          setCancelling(false)
          await handleCancel()
        }}
      />
    </div>
  )
}
