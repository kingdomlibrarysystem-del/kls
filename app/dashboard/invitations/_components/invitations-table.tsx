'use client'

import { useState, useEffect } from 'react'
import { RefreshCcw, MailX, Eye, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { invitationStatusConfig, type Invitation } from './invitations-data'
import { InvitationDetailModal } from './invitation-detail-modal'
import { CancelInvitationModal } from './cancel-invitation-modal'

/** Simulated network delay before mock invitations become visible. */
const LOAD_DELAY_MS = 400

interface InvitationsTableProps {
  invitations: Invitation[]
  onUpdateInvitation: (invitation: Invitation) => void
  onRemoveInvitation: (id: string) => void
}

function buildColumns(
  onResend: (i: Invitation) => void,
  onView: (i: Invitation) => void,
  onCancel: (i: Invitation) => void
): Column<Invitation>[] {
  return [
    { key: 'email', label: 'Email', sortable: true, render: (i) => <span className="font-semibold text-w-950">{i.email}</span> },
    { key: 'role', label: 'Role', sortable: true, render: (i) => <span className="text-w-700">{i.role}</span> },
    { key: 'sentAt', label: 'Sent', sortable: true, render: (i) => <span className="text-w-700">{i.sentAt}</span> },
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
          <button onClick={() => onView(i)} aria-label={`View invitation for ${i.email}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Eye size={14} />
          </button>
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
export function InvitationsTable({ invitations, onUpdateInvitation, onRemoveInvitation }: InvitationsTableProps) {
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [viewing, setViewing] = useState<Invitation | null>(null)
  const [cancelling, setCancelling] = useState<Invitation | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleResend = (invitation: Invitation) => {
    try {
      onUpdateInvitation({ ...invitation, status: 'PENDING', sentAt: new Date().toISOString().split('T')[0] })
      setToast(`Invitation resent to ${invitation.email}`)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Could not resend this invitation — please try again')
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
        columns={buildColumns(handleResend, setViewing, setCancelling)}
        rowKey={(i) => i.id}
        searchPlaceholder="Search email or role..."
        searchFilter={(i, q) => i.email.toLowerCase().includes(q) || i.role.toLowerCase().includes(q)}
        emptyMessage="No invitations match your search."
      />

      <InvitationDetailModal invitation={viewing} onClose={() => setViewing(null)} />
      <CancelInvitationModal
        invitation={cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={() => {
          if (cancelling) onRemoveInvitation(cancelling.id)
          setCancelling(null)
        }}
      />
    </div>
  )
}
