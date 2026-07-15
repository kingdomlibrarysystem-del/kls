'use client'

import { useState, useEffect } from 'react'
import { BookCopy, Eye, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { publicationStatusConfig, withdrawableStatuses, type MySubmission } from './my-submissions-data'
import { useMySubmissions, removeMySubmission } from './use-my-submissions'
import { SubmissionDetailModal } from './submission-detail-modal'
import { WithdrawSubmissionModal } from './withdraw-submission-modal'

/** Simulated network delay before mock submissions become visible. */
const LOAD_DELAY_MS = 400

function buildColumns(onView: (s: MySubmission) => void, onWithdraw: (s: MySubmission) => void): Column<MySubmission>[] {
  return [
    { key: 'title', label: 'Title', sortable: true, render: (s) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.category}</span> },
    { key: 'submittedAt', label: 'Submitted', sortable: true, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.submittedAt}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (s) => (
        <span
          style={{
            padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            border: `1px solid ${publicationStatusConfig[s.status].border}`, background: publicationStatusConfig[s.status].bg, color: publicationStatusConfig[s.status].color,
          }}
        >
          {publicationStatusConfig[s.status].label}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => onView(s)} aria-label={`View ${s.title}`} style={{ padding: 6, borderRadius: 6, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Eye size={14} />
          </button>
          {withdrawableStatuses.includes(s.status) && (
            <button onClick={() => onWithdraw(s)} aria-label={`Withdraw ${s.title}`} style={{ padding: 6, borderRadius: 6, color: 'var(--red-light)', background: 'none', border: 'none', cursor: 'pointer' }}>
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
