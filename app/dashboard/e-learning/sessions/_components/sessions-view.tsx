'use client'

import { useState, useEffect } from 'react'
import { CalendarClock } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests } from '@/app/lecturer/_shared/use-session-requests'
import { sessionStatusConfig, type SessionRequest, type SessionStatus } from '@/app/lecturer/_shared/session-requests-data'
import { SessionsStats } from './sessions-stats'

/** Simulated network delay before mock session requests become visible. */
const LOAD_DELAY_MS = 400

function buildColumns(): Column<SessionRequest>[] {
  return [
    { key: 'learnerName', label: 'Learner', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.learnerName}</span> },
    { key: 'lecturerName', label: 'Lecturer', sortable: true, render: (r) => <span className="text-w-700">{r.lecturerName}</span> },
    { key: 'courseTitle', label: 'Course', sortable: true, render: (r) => <span className="text-w-700 max-w-55 truncate block">{r.courseTitle}</span> },
    { key: 'requestedAt', label: 'Requested', sortable: true, render: (r) => <span className="text-w-700">{r.requestedAt}</span> },
    {
      key: 'scheduledAt', label: 'Scheduled', sortable: true,
      render: (r) => <span className="text-w-700">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : '—'}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${sessionStatusConfig[r.status].cls}`}>
          {sessionStatusConfig[r.status].label}
        </span>
      ),
    },
  ]
}

/**
 * Read-only DataTable of all live-session requests across every lecturer —
 * matches the enrollments admin page's pattern (real data, no direct
 * approve/reject action here; that decision belongs on the lecturer's own
 * Session Requests queue).
 */
export function SessionsView() {
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all')
  const requests = useSessionRequests()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading session requests">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const tableData = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter)

  const statusSelect = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value as SessionStatus | 'all')}
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
    >
      <option value="all">All Statuses</option>
      {(Object.keys(sessionStatusConfig) as SessionStatus[]).map((s) => (
        <option key={s} value={s}>{sessionStatusConfig[s].label}</option>
      ))}
    </select>
  )

  return (
    <>
      <SessionsStats data={requests} />
      {requests.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No session requests yet" description="Requests learners make across all courses will appear here." />
      ) : (
        <DataTable<SessionRequest>
          data={tableData}
          columns={buildColumns()}
          rowKey={(r) => r.id}
          searchPlaceholder="Search learner, lecturer, or course..."
          searchFilter={(r, q) => r.learnerName.toLowerCase().includes(q) || r.lecturerName.toLowerCase().includes(q) || r.courseTitle.toLowerCase().includes(q)}
          filters={statusSelect}
          emptyMessage="No requests match your search."
        />
      )}
    </>
  )
}
