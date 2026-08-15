'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Shield, CalendarDays, Hash, ArrowLeft, RefreshCcw, XCircle, MailX } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { CancelInvitationModal } from '../../_components/cancel-invitation-modal'
import { useInvitations } from '../../_components/use-invitations'
import { invitationStatusConfig, type Invitation } from '../../_components/invitations-data'

interface InvitationDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-16 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium break-all">{value}</span>
    </div>
  )
}

/**
 * Real details page for a single invitation, replacing the modal that used
 * to open from the Invitations table's "View" button. Fetches directly from
 * /api/invitations/:id rather than relying on the already-loaded list, so
 * this page also works when linked to directly.
 */
export function InvitationDetailView({ id }: InvitationDetailViewProps) {
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState('')
  const { resendInvitation, removeInvitation } = useInvitations()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/invitations/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Invitation not found')
          return
        }
        setInvitation(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load invitation') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleResend = async () => {
    if (!invitation) return
    try {
      await resendInvitation(invitation.id)
      setInvitation({ ...invitation, status: 'PENDING' })
      setToast(`Invitation resent to ${invitation.email}`)
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not resend this invitation — please try again')
    }
  }

  const handleCancel = async () => {
    if (!invitation) return
    await removeInvitation(invitation.id)
    router.push('/dashboard/invitations')
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Invitation Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div>
        <PageHeader title="Invitation Details" />
        <EmptyState icon={MailX} title="Invitation not found" description={error || 'This invitation does not exist or was cancelled.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/invitations" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Invitations
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
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
          <DetailRow icon={<CalendarDays size={13} />} label="Sent" value={new Date(invitation.sentAt).toLocaleDateString()} />
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
