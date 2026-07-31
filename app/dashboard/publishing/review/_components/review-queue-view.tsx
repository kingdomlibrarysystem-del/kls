'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ClipboardList, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { logAuditEvent } from '@/app/dashboard/audit-log/_components/use-audit-log'
import { publicationStatusConfig, type PublicationSubmission } from './review-data'
import { ReviewModal } from './review-modal'
import { usePublications, approvePublication, rejectPublication, type PublicationRecord } from '../../_shared/use-publications'

/** Statuses actionable from this queue — a submission still awaiting a manager's decision. Everything else (DRAFT/APPROVED/REJECTED/PUBLISHED) has already moved past this stage and lives on in the shared store for the contributor's own My Submissions view, not deleted. */
const QUEUE_STATUSES: PublicationSubmission['status'][] = ['SUBMITTED', 'UNDER_REVIEW']

type ModalAction = 'approve' | 'reject' | null

/**
 * Review Queue: submissions with SUBMITTED/UNDER_REVIEW status, Approve/Reject
 * buttons that open a confirmation modal. Reads the shared `usePublications()`
 * store — the same real Publication collection the Catalog and Revenue
 * pages read — so a decision here is immediately visible there too, with
 * no separate sync step.
 */
export function ReviewQueueView() {
  const [toast, setToast] = useState('')
  const [modalTarget, setModalTarget] = useState<PublicationRecord | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)

  const { data: allSubmissions, loading, error } = usePublications()
  const queue = allSubmissions.filter((s) => QUEUE_STATUSES.includes(s.status))
  const { user: currentUser } = useAuth()
  const actorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Manager User'

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const openModal = (submission: PublicationRecord, action: 'approve' | 'reject') => {
    setModalTarget(submission)
    setModalAction(action)
  }

  const closeModal = () => { setModalTarget(null); setModalAction(null) }

  const handleConfirm = async (notes: string) => {
    try {
      if (!modalTarget || !modalAction) throw new Error('No submission selected')
      if (modalAction === 'approve') await approvePublication(modalTarget.id)
      else await rejectPublication(modalTarget.id)
      logAuditEvent({
        actor: actorName,
        action: modalAction === 'approve' ? 'PUBLICATION_APPROVED' : 'PUBLICATION_REJECTED',
        target: modalTarget.title,
        notes: notes || (modalAction === 'approve' ? 'Approved after review.' : 'Rejected after review.'),
      })
      showToast(
        `${modalAction === 'approve' ? 'Approved' : 'Rejected'} "${modalTarget.title}"${notes ? ` — notes: ${notes}` : ''}`
      )
      closeModal()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update this submission — please try again')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading review queue">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the review queue" description={error} />
  }

  const columns: Column<PublicationRecord>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (s) => <span className="font-semibold text-w-950 max-w-55 truncate block">{s.title}</span> },
    { key: 'contributor', label: 'Contributor', sortable: true, render: (s) => <span className="text-w-700">{s.contributor}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (s) => <span className="text-w-700">{s.category}</span> },
    { key: 'submittedAt', label: 'Submitted', sortable: true, render: (s) => <span className="text-w-700">{s.submittedAt}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (s) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${publicationStatusConfig[s.status].cls}`}>
          {publicationStatusConfig[s.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openModal(s, 'approve')}
            aria-label={`Approve ${s.title}`}
            className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors"
          >
            <CheckCircle size={12} /> Approve
          </button>
          <button
            onClick={() => openModal(s, 'reject')}
            aria-label={`Reject ${s.title}`}
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

      {queue.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Review queue is empty" description="All submissions have been reviewed." />
      ) : (
        <DataTable<PublicationRecord>
          data={queue}
          columns={columns}
          rowKey={(s) => s.id}
          searchPlaceholder="Search title or contributor..."
          searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.contributor.toLowerCase().includes(q)}
          emptyMessage="No submissions match your search."
        />
      )}

      <ReviewModal submission={modalTarget} action={modalAction} onClose={closeModal} onConfirm={handleConfirm} />
    </div>
  )
}
