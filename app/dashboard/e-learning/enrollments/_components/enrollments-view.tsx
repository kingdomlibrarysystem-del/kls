'use client'

import { useState, useEffect } from 'react'
import { GraduationCap } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockEnrollments, enrollmentStatusConfig, type Enrollment, type EnrollmentStatus } from './enrollments-data'

/** Simulated network delay before mock enrollments become visible. */
const LOAD_DELAY_MS = 400

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading enrollments">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

const columns: Column<Enrollment>[] = [
  { key: 'member', label: 'Member', sortable: true, render: (e) => <span className="font-semibold text-w-950">{e.member}</span> },
  { key: 'course', label: 'Course', sortable: true, render: (e) => <span className="text-w-700 max-w-55 truncate block">{e.course}</span> },
  { key: 'enrolledAt', label: 'Enrolled', sortable: true, render: (e) => <span className="text-w-700">{e.enrolledAt}</span> },
  {
    key: 'status', label: 'Status', sortable: true,
    render: (e) => (
      <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${enrollmentStatusConfig[e.status].cls}`}>
        {enrollmentStatusConfig[e.status].label}
      </span>
    ),
  },
  {
    key: 'progress', label: 'Progress', sortable: true,
    render: (e) => (
      <div className="flex items-center gap-2 min-w-25">
        <div className="flex-1 h-1.5 bg-w-200 rounded-full overflow-hidden">
          <div className="h-full bg-w-600 rounded-full" style={{ width: `${e.progress}%` }} />
        </div>
        <span className="text-xs text-w-700 font-semibold">{e.progress}%</span>
      </div>
    ),
  },
]

/**
 * Enrollments table with a simulated initial load and status filtering.
 * Shows a skeleton while "loading," then the table, or an EmptyState if a
 * filter yields zero rows.
 */
export function EnrollmentsView() {
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingSkeleton />

  const tableData = statusFilter === 'all' ? mockEnrollments : mockEnrollments.filter((e) => e.status === statusFilter)

  const statusSelect = (
    <select
      value={statusFilter}
      onChange={(ev) => setStatusFilter(ev.target.value as EnrollmentStatus | 'all')}
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
    >
      <option value="all">All Statuses</option>
      {(Object.keys(enrollmentStatusConfig) as EnrollmentStatus[]).map((s) => (
        <option key={s} value={s}>{enrollmentStatusConfig[s].label}</option>
      ))}
    </select>
  )

  if (mockEnrollments.length > 0 && tableData.length === 0) {
    return (
      <div>
        <div className="mb-3">{statusSelect}</div>
        <EmptyState
          icon={GraduationCap}
          title="No enrollments found"
          description="Try a different status filter."
        />
      </div>
    )
  }

  return (
    <DataTable<Enrollment>
      data={tableData}
      columns={columns}
      rowKey={(e) => e.id}
      searchPlaceholder="Search member or course..."
      searchFilter={(e, q) => e.member.toLowerCase().includes(q) || e.course.toLowerCase().includes(q)}
      filters={statusSelect}
      emptyMessage="No enrollments match your search."
    />
  )
}
