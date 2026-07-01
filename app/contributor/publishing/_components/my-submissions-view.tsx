'use client'

import { useState, useEffect } from 'react'
import { BookCopy } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mySubmissions, publicationStatusConfig, type MySubmission } from './my-submissions-data'

/** Simulated network delay before mock submissions become visible. */
const LOAD_DELAY_MS = 400

const columns: Column<MySubmission>[] = [
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
]

/** My Submissions: this contributor's publications, filterable by search. */
export function MySubmissionsView() {
  const [loading, setLoading] = useState(true)

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

  if (mySubmissions.length === 0) {
    return <EmptyState icon={BookCopy} title="No submissions yet" description="Submit a book to see it tracked here." style={{ color: 'var(--text-secondary)' }} />
  }

  return (
    <DataTable<MySubmission>
      data={mySubmissions}
      columns={columns}
      rowKey={(s) => s.id}
      searchPlaceholder="Search title or category..."
      searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)}
      emptyMessage="No submissions match your search."
    />
  )
}
