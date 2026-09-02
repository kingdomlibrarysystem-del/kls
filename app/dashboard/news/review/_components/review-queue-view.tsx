'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ClipboardList, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { articleStatusConfig, type NewsArticle } from '../../_shared/news-data'
import { ReviewModal } from './review-modal'
import { useArticles, approveArticle, rejectArticle } from '../../_shared/use-articles'

const QUEUE_STATUSES: NewsArticle['status'][] = ['SUBMITTED', 'UNDER_REVIEW']

type ModalAction = 'approve' | 'reject' | null

/** Review Queue: SUBMITTED/UNDER_REVIEW articles, Approve/Reject with a confirmation modal — directly mirrors Publishing's review-queue-view.tsx. */
export function ReviewQueueView() {
  const [toast, setToast] = useState('')
  const [modalTarget, setModalTarget] = useState<NewsArticle | null>(null)
  const [modalAction, setModalAction] = useState<ModalAction>(null)

  const { data: allArticles, loading, error } = useArticles()
  const queue = allArticles.filter((a) => QUEUE_STATUSES.includes(a.status))

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const openModal = (article: NewsArticle, action: 'approve' | 'reject') => {
    setModalTarget(article)
    setModalAction(action)
  }
  const closeModal = () => { setModalTarget(null); setModalAction(null) }

  const handleConfirm = async (notes: string) => {
    try {
      if (!modalTarget || !modalAction) throw new Error('No article selected')
      if (modalAction === 'approve') await approveArticle(modalTarget.id)
      else await rejectArticle(modalTarget.id)
      showToast(`${modalAction === 'approve' ? 'Approved' : 'Rejected'} "${modalTarget.title}"${notes ? ` — notes: ${notes}` : ''}`)
      closeModal()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update this article — please try again')
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading review queue" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load the review queue" description={error} />

  const columns: Column<NewsArticle>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (a) => <span className="font-semibold text-w-950 max-w-55 truncate block">{a.title}</span> },
    { key: 'authorName', label: 'Author', sortable: true, render: (a) => <span className="text-w-700">{a.authorName}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (a) => <span className="text-w-700">{a.category}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (a) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${articleStatusConfig[a.status].cls}`}>{articleStatusConfig[a.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => openModal(a, 'approve')} aria-label={`Approve ${a.title}`} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors"><CheckCircle size={12} /> Approve</button>
          <button onClick={() => openModal(a, 'reject')} aria-label={`Reject ${a.title}`} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors"><XCircle size={12} /> Reject</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      {queue.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Review queue is empty" description="All articles have been reviewed." />
      ) : (
        <DataTable<NewsArticle>
          data={queue}
          columns={columns}
          rowKey={(a) => a.id}
          searchPlaceholder="Search title or author..."
          searchFilter={(a, q) => a.title.toLowerCase().includes(q) || a.authorName.toLowerCase().includes(q)}
          emptyMessage="No articles match your search."
        />
      )}

      <ReviewModal article={modalTarget} action={modalAction} onClose={closeModal} onConfirm={handleConfirm} />
    </div>
  )
}
