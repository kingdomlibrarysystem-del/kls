'use client'

import { useState } from 'react'
import { RefreshCcw, MailX, Eye, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { invitationStatusConfig, type Invitation } from './invitations-data'
import { CancelInvitationModal } from './cancel-invitation-modal'

interface InvitationsTableProps {
  invitations: Invitation[]
  loading: boolean
  onResendInvitation: (id: string) => Promise<void>
  onRemoveInvitation: (id: string) => Promise<void>
}

function buildColumns(
  onResend: (i: Invitation) => void,
  onCancel: (i: Invitation) => void
): Column<Invitation>[] {
  return [
    { key: 'email', label: 'Email', sortable: true, render: (i) => <span className="font-semibold text-w-950">{i.email}</span> },
    { key: 'role', label: 'Role', sortable: true, render: (i) => <span className="text-w-700">{i.role.name}</span> },
    { key: 'sentAt', label: 'Sent', sortable: true, render: (i) => <span className="text-w-700">{new Date(i.sentAt).toLocaleDateString()}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (i) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${invitationStatusConfig[i.status].cls}`}>
          {invitationStatusConfig[i.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5">
          <UniversalButton
            href={`/dashboard/invitations/${i.id}`}
            variant="ghost"
            size="icon"
            aria-label={`View invitation for ${i.email}`}
            className="text-w-700 hover:bg-w-100 hover:text-w-950"
          >
            <Eye size={14} />
          </UniversalButton>
          {i.status !== 'ACCEPTED' && (
            <>
              <button
                onClick={() => onResend(i)}
                aria-label={`Resend invitation to ${i.email}`}
                className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
              >
                <RefreshCcw size={12} /> Resend
              </button>
              <button onClick={() => onCancel(i)} aria-label={`Cancel invitation to ${i.email}`} className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]
}

/** DataTable of pending/accepted/expired invitations with View, Resend (non-accepted), and Cancel (non-accepted) actions. */
export function InvitationsTable({ invitations, loading, onResendInvitation, onRemoveInvitation }: InvitationsTableProps) {
  const [toast, setToast] = useState('')
  const [cancelling, setCancelling] = useState<Invitation | null>(null)

  const handleResend = async (invitation: Invitation) => {
    try {
      await onResendInvitation(invitation.id)
      setToast(`Invitation resent to ${invitation.email}`)
      setTimeout(() => setToast(''), 3000)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not resend this invitation — please try again')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading invitations">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (invitations.length === 0) {
    return <EmptyState icon={MailX} title="No invitations sent yet" description="Use the form above to invite a new user." />
  }

  return (
    <div>
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}
      <DataTable<Invitation>
        data={invitations}
        columns={buildColumns(handleResend, setCancelling)}
        rowKey={(i) => i.id}
        searchPlaceholder="Search email or role..."
        searchFilter={(i, q) => i.email.toLowerCase().includes(q) || i.role.name.toLowerCase().includes(q)}
        emptyMessage="No invitations match your search."
      />

      <CancelInvitationModal
        invitation={cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={async () => {
          if (cancelling) await onRemoveInvitation(cancelling.id)
          setCancelling(null)
        }}
      />
    </div>
  )
}
