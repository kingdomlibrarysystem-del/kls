'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ClipboardList, ShieldAlert } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { logAuditEvent } from '@/app/dashboard/audit-log/_components/use-audit-log'
import { publicationStatusConfig, type PublicationStatus } from './review-data'
import { ReviewModal } from './review-modal'
import { approvePublication, rejectPublication, type PublicationRecord } from '../../_shared/use-publications'

type ModalAction = 'approve' | 'reject' | null

interface ReviewQueueViewProps {
  /** Books in SUBMITTED / UNDER_REVIEW, loaded by the server page. */
  initialQueue: PublicationRecord[]
  /** The signed-in role has "publications:approve" (or is Admin). */
  canApprove: boolean
  currentUserId: string
  isAdmin: boolean
}

/**
 * Review Queue: Approve (publishes the book to the library) or Reject (with a
 * reason the publisher sees and can act on). A decided book leaves the list.
 * Without the approval permission the list is read-only; nobody but an Admin
 * can decide on their own book.
 */
export function ReviewQueueView({ initialQueue, canApprove, currentUserId, isAdmin }: ReviewQueueViewProps) {
  const [queue, setQueue] = useState(initialQueue)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [modalTarget, setModalTarget] = useState<PublicationRecord | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const { user: currentUser } = useAuth()
  const actorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Reviewer'

  const showToast = (ok: boolean, text: string) => { setToast({ ok, text }); setTimeout(() => setToast(null), 4000) }
  const openModal = (submission: PublicationRecord, action: 'approve' | 'reject') => { setModalTarget(submission); setModalAction(action) }
  const closeModal = () => { setModalTarget(null); setModalAction(null) }

  const handleConfirm = async (notes: string) => {
    if (!modalTarget || !modalAction) return
    try {
      if (modalAction === 'approve') await approvePublication(modalTarget.id, notes || undefined)
      else await rejectPublication(modalTarget.id, notes)
      logAuditEvent({
        actor: actorName,
        action: modalAction === 'approve' ? 'PUBLICATION_APPROVED' : 'PUBLICATION_REJECTED',
        target: modalTarget.title,
        notes: notes || 'Approved after review.',
      })
      setQueue((q) => q.filter((p) => p.id !== modalTarget.id))
      showToast(true, modalAction === 'approve' ? `“${modalTarget.title}” is published — members can now find it in the library.` : `“${modalTarget.title}” was sent back to the publisher.`)
      closeModal()
    } catch (e) {
      showToast(false, e instanceof Error ? e.message : 'Could not update this book — please try again')
      closeModal()
    }
  }

  const columns: Column<PublicationRecord>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (s) => <span className="block max-w-55 truncate font-semibold text-w-950">{s.title}</span> },
    { key: 'contributor', label: 'Publisher', sortable: true, render: (s) => <span className="text-w-700">{s.contributor}</span> },
    { key: 'category', label: 'KCS category', sortable: true, render: (s) => <span className="text-w-700">{s.category || '—'}</span> },
    { key: 'submittedAt', label: 'Submitted', sortable: true, render: (s) => <span className="text-w-700">{s.submittedAt}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (s) => {
        const cfg = publicationStatusConfig[s.status as PublicationStatus] ?? publicationStatusConfig.SUBMITTED
        return <span className={`rounded border px-2.5 py-0.5 font-lato text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
      },
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => {
        const own = s.contributorId === currentUserId && !isAdmin
        if (!canApprove || own) {
          return <span className="text-xs text-muted-foreground">{own ? 'Your book — another reviewer decides' : 'View only'}</span>
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => openModal(s, 'approve')}
              aria-label={`Approve ${s.title}`}
              className="flex items-center gap-1 rounded border border-green-200 bg-green-50 px-2.5 py-1 font-lato text-xs text-green-700 transition-colors hover:bg-green-100 dark:border-success/30 dark:bg-success/10 dark:text-success dark:hover:bg-success/20"
            >
              <CheckCircle size={12} /> Approve
            </button>
            <button
              onClick={() => openModal(s, 'reject')}
              aria-label={`Reject ${s.title}`}
              className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1 font-lato text-xs text-red-700 transition-colors hover:bg-red-100 dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive dark:hover:bg-destructive/20"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {!canApprove && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>You can see the queue, but your role can&apos;t approve or reject books. An admin can grant <b>Approve Publications</b> in Roles &amp; Permissions.</span>
        </div>
      )}
      {toast && (
        <div role="status" className={`rounded border px-4 py-3 font-lato text-sm ${toast.ok ? 'border-green-200 bg-green-50 text-green-800 dark:border-success/30 dark:bg-success/10 dark:text-success' : 'border-red-200 bg-red-50 text-red-700 dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive'}`}>
          {toast.text}
        </div>
      )}

      {queue.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Review queue is empty" description="No books are waiting for review." />
      ) : (
        <DataTable<PublicationRecord>
          data={queue}
          columns={columns}
          rowKey={(s) => s.id}
          searchPlaceholder="Search title or publisher..."
          searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.contributor.toLowerCase().includes(q)}
          emptyMessage="No books match your search."
        />
      )}

      <ReviewModal submission={modalTarget} action={modalAction} onClose={closeModal} onConfirm={handleConfirm} />
    </div>
  )
}
