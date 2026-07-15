'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { addNotification } from '@/app/dashboard/notifications/_components/use-notifications'
import { LECTURER_NAME } from '@/lib/identity/lecturer-identity'
import {
  useSessionRequests,
  approveSession,
  rejectSession,
} from '@/lib/sessions/use-session-requests'
import type { SessionRequest } from '@/lib/sessions/session-requests-data'
import { SessionDecisionModal } from '@/lib/sessions/session-decision-modal'

/** Simulated network delay before mock session requests become visible. */
const LOAD_DELAY_MS = 400

type ModalAction = 'approve' | 'reject' | null

/**
 * Session-request queue for this lecturer's PENDING requests — mirrors
 * review-queue-view.tsx exactly (real shared store, DataTable, confirm
 * modal). Approving/rejecting notifies the learner via the real shared
 * notifications store, same as the request side notifies the lecturer.
 */
export function SessionRequestsView() {
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [modalTarget, setModalTarget] = useState<SessionRequest | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)

  const requests = useSessionRequests()
  const pending = requests.filter((r) => r.lecturerName === LECTURER_NAME && r.status === 'PENDING')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const openModal = (request: SessionRequest, action: 'approve' | 'reject') => {
    setModalTarget(request)
    setModalAction(action)
  }

  const closeModal = () => { setModalTarget(null); setModalAction(null) }

  const handleApprove = (scheduledAt: string, notes: string) => {
    if (!modalTarget) return
    approveSession(modalTarget.id, scheduledAt, notes || undefined)
    addNotification({
      type: 'course',
      title: 'Session Approved',
      message: `${LECTURER_NAME} approved your session for "${modalTarget.courseTitle}" — ${new Date(scheduledAt).toLocaleString()}.`,
      href: '/member/sessions',
      recipientRole: 'member',
    })
    showToast(`Approved session with ${modalTarget.learnerName}`)
    closeModal()
  }

  const handleReject = (notes: string) => {
    if (!modalTarget) return
    rejectSession(modalTarget.id, notes)
    addNotification({
      type: 'course',
      title: 'Session Declined',
      message: `${LECTURER_NAME} declined your session request for "${modalTarget.courseTitle}".`,
      href: '/member/sessions',
      recipientRole: 'member',
    })
    showToast(`Rejected session with ${modalTarget.learnerName}`)
    closeModal()
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading session requests">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const columns: Column<SessionRequest>[] = [
    { key: 'learnerName', label: 'Learner', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.learnerName}</span> },
    { key: 'courseTitle', label: 'Course', sortable: true, render: (r) => <span className="text-w-700 max-w-55 truncate block">{r.courseTitle}</span> },
    { key: 'proposedTime', label: 'Proposed Time', sortable: true, render: (r) => <span className="text-w-700">{new Date(r.proposedTime).toLocaleString()}</span> },
    { key: 'notes', label: 'Notes', render: (r) => <span className="text-w-700 max-w-45 truncate block">{r.notes || '—'}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openModal(r, 'approve')}
            aria-label={`Approve session request from ${r.learnerName}`}
            className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors"
          >
            <CheckCircle size={12} /> Approve
          </button>
          <button
            onClick={() => openModal(r, 'reject')}
            aria-label={`Reject session request from ${r.learnerName}`}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors"
          >
            <XCircle size={12} /> Reject
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}

      {pending.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No pending requests" description="Session requests from your learners will appear here." />
      ) : (
        <DataTable<SessionRequest>
          data={pending}
          columns={columns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search learner or course..."
          searchFilter={(r, q) => r.learnerName.toLowerCase().includes(q) || r.courseTitle.toLowerCase().includes(q)}
          emptyMessage="No requests match your search."
        />
      )}

      <SessionDecisionModal
        request={modalTarget}
        action={modalAction}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
