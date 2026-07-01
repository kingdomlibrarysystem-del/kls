'use client'

import { useState, useEffect } from 'react'
import { RefreshCcw, MailX } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockInvitations, invitationStatusConfig, type Invitation } from './invitations-data'

/** Simulated network delay before mock invitations become visible. */
const LOAD_DELAY_MS = 400

/** DataTable of pending/accepted/expired invitations with a "Resend" action for non-accepted rows. */
export function InvitationsTable() {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvitations(mockInvitations)
      setLoading(false)
    }, LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleResend = (invitation: Invitation) => {
    try {
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitation.id ? { ...inv, status: 'PENDING', sentAt: new Date().toISOString().split('T')[0] } : inv))
      )
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

  const columns: Column<Invitation>[] = [
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
      render: (i) => i.status !== 'ACCEPTED' ? (
        <button
          onClick={() => handleResend(i)}
          aria-label={`Resend invitation to ${i.email}`}
          className="flex items-center gap-1 px-2.5 py-1 ml-auto bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
        >
          <RefreshCcw size={12} /> Resend
        </button>
      ) : null,
    },
  ]

  return (
    <div>
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}
      <DataTable<Invitation>
        data={invitations}
        columns={columns}
        rowKey={(i) => i.id}
        searchPlaceholder="Search email or role..."
        searchFilter={(i, q) => i.email.toLowerCase().includes(q) || i.role.toLowerCase().includes(q)}
        emptyMessage="No invitations match your search."
      />
    </div>
  )
}
