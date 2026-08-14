'use client'

import { useState } from 'react'
import { GraduationCap, Eye, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useEnrollmentsAdmin } from './use-enrollments-admin'
import { enrollmentStatusConfig, type EnrollmentStatus } from './enrollments-data'
import { EnrollmentDetailModal } from './enrollment-detail-modal'
import { EnrollmentsStats } from './enrollments-stats'

/** Row shape actually rendered by the table. */
export interface DisplayEnrollment {
  id: string
  member: string
  courseId: string
  courseTitle: string
  enrolledAt: string
  status: EnrollmentStatus
  progress: number
}

function toDisplayStatus(status: string): EnrollmentStatus {
  return status === 'ENROLLED' ? 'ACTIVE' : (status as EnrollmentStatus)
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading enrollments">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

function buildColumns(onView: (e: DisplayEnrollment) => void): Column<DisplayEnrollment>[] {
  return [
    { key: 'member', label: 'Member', sortable: true, render: (e) => <span className="font-semibold text-w-950">{e.member}</span> },
    { key: 'courseTitle', label: 'Course', sortable: true, render: (e) => <span className="text-w-700 max-w-55 truncate block">{e.courseTitle}</span> },
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
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (e) => (
        <button onClick={() => onView(e)} aria-label={`View enrollment for ${e.member}`} className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
          <Eye size={12} /> View
        </button>
      ),
    },
  ]
}

/** Enrollments table across all members, backed by the real Enrollment collection. */
export function EnrollmentsView() {
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all')
  const [viewing, setViewing] = useState<DisplayEnrollment | null>(null)

  const { data: enrollments, loading, error } = useEnrollmentsAdmin()
  const allRows: DisplayEnrollment[] = enrollments.map((e) => ({
    id: e.id,
    member: e.member,
    courseId: e.courseId,
    courseTitle: e.courseTitle,
    enrolledAt: e.enrolledAt,
    status: toDisplayStatus(e.status),
    progress: e.progress,
  }))

  if (loading) return <LoadingSkeleton />

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load enrollments" description={error} />
  }

  const tableData = statusFilter === 'all' ? allRows : allRows.filter((e) => e.status === statusFilter)

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

  if (allRows.length > 0 && tableData.length === 0) {
    return (
      <div>
        <EnrollmentsStats data={allRows} />
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
    <>
      <EnrollmentsStats data={allRows} />
      <DataTable<DisplayEnrollment>
        data={tableData}
        columns={buildColumns(setViewing)}
        rowKey={(e) => e.id}
        searchPlaceholder="Search member or course..."
        searchFilter={(e, q) => e.member.toLowerCase().includes(q) || e.courseTitle.toLowerCase().includes(q)}
        filters={statusSelect}
        emptyMessage="No enrollments match your search."
      />
      <EnrollmentDetailModal enrollment={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
