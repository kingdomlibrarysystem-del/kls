'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockSubmissions, reviewStatusConfig, type PublicationSubmission } from './review-data'
import { ReviewModal } from './review-modal'

/** Simulated network delay before mock submissions become visible. */
const LOAD_DELAY_MS = 400

type ModalAction = 'approve' | 'reject' | null

/**
 * Review Queue: submissions with SUBMITTED/UNDER_REVIEW status, Approve/Reject
 * buttons that open a confirmation modal. Approving/rejecting removes the row
 * from the local queue for the session only — no persistence.
 */
export function ReviewQueueView() {
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<PublicationSubmission[]>([])
  const [toast, setToast] = useState('')
  const [modalTarget, setModalTarget] = useState<PublicationSubmission | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueue(mockSubmissions)
      setLoading(false)
    }, LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const openModal = (submission: PublicationSubmission, action: 'approve' | 'reject') => {
    setModalTarget(submission)
    setModalAction(action)
  }

  const closeModal = () => { setModalTarget(null); setModalAction(null) }

  const handleConfirm = (notes: string) => {
    try {
      if (!modalTarget || !modalAction) throw new Error('No submission selected')
      setQueue((prev) => prev.filter((s) => s.id !== modalTarget.id))
      showToast(
        `${modalAction === 'approve' ? 'Approved' : 'Rejected'} "${modalTarget.title}"${notes ? ` — notes: ${notes}` : ''}`
      )
      closeModal()
    } catch {
      showToast('Could not update this submission — please try again')
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

  const columns: Column<PublicationSubmission>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (s) => <span className="font-semibold text-w-950 max-w-55 truncate block">{s.title}</span> },
    { key: 'contributor', label: 'Contributor', sortable: true, render: (s) => <span className="text-w-700">{s.contributor}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (s) => <span className="text-w-700">{s.category}</span> },
    { key: 'submittedAt', label: 'Submitted', sortable: true, render: (s) => <span className="text-w-700">{s.submittedAt}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (s) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${reviewStatusConfig[s.status].cls}`}>
          {reviewStatusConfig[s.status].label}
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
        <DataTable<PublicationSubmission>
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
