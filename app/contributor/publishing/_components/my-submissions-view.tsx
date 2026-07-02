'use client'

import { useState, useEffect } from 'react'
import { BookCopy, Eye, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { publicationStatusConfig, type MySubmission } from './my-submissions-data'
import { useMySubmissions, removeMySubmission } from './use-my-submissions'
import { SubmissionDetailModal } from './submission-detail-modal'
import { WithdrawSubmissionModal } from './withdraw-submission-modal'

/** Simulated network delay before mock submissions become visible. */
const LOAD_DELAY_MS = 400

/** Statuses a contributor may still withdraw before a manager has started reviewing. */
const WITHDRAWABLE_STATUSES: MySubmission['status'][] = ['DRAFT', 'SUBMITTED']

function buildColumns(onView: (s: MySubmission) => void, onWithdraw: (s: MySubmission) => void): Column<MySubmission>[] {
  return [
    { key: 'title', label: 'Title', sortable: true, render: (s) => <span className="font-semibold text-w-950">{s.title}</span> },
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
          <button onClick={() => onView(s)} aria-label={`View ${s.title}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Eye size={14} />
          </button>
          {WITHDRAWABLE_STATUSES.includes(s.status) && (
            <button onClick={() => onWithdraw(s)} aria-label={`Withdraw ${s.title}`} className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors">
              <XCircle size={14} />
            </button>
          )}
        </div>
      ),
    },
  ]
}

/** My Submissions: this contributor's publications, filterable by search, with Details and Withdraw (draft/submitted only) actions. */
export function MySubmissionsView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<MySubmission | null>(null)
  const [withdrawing, setWithdrawing] = useState<MySubmission | null>(null)
  const submissions = useMySubmissions()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading my submissions">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} style={{ height: 48, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (submissions.length === 0) {
    return <EmptyState icon={BookCopy} title="No submissions yet" description="Submit a book to see it tracked here." style={{ color: 'var(--text-secondary)' }} />
  }

  return (
    <>
      <DataTable<MySubmission>
        data={submissions}
        columns={buildColumns(setViewing, setWithdrawing)}
        rowKey={(s) => s.id}
        searchPlaceholder="Search title or category..."
        searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)}
        emptyMessage="No submissions match your search."
      />
      <SubmissionDetailModal submission={viewing} onClose={() => setViewing(null)} />
      <WithdrawSubmissionModal
        submission={withdrawing}
        onClose={() => setWithdrawing(null)}
        onConfirm={() => {
          if (withdrawing) removeMySubmission(withdrawing.id)
          setWithdrawing(null)
        }}
      />
    </>
  )
}
