'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Eye, Pencil, Archive, PlusCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useCourseCatalog, archiveCourseInCatalog } from '../../_shared/use-course-catalog'
import { languageLabels } from '../../add/_components/course-form-schema'
import { CourseDetailModal } from './course-detail-modal'
import { EditCourseModal } from './edit-course-modal'
import { ArchiveCourseModal } from './archive-course-modal'
import { statusConfig, type CourseCatalogEntry, type CourseStatus } from './catalog-config'

/** Simulated network delay before the catalog becomes visible. */
const LOAD_DELAY_MS = 400

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading course catalog">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

/**
 * Admin Course Catalog: lists every course created via Add Course, with
 * Details, Edit, and Archive actions. Reads from the shared
 * `/dashboard/e-learning/*` course catalog store, so newly-created courses
 * appear here immediately.
 */
export function CatalogView() {
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all')
  const [viewing, setViewing] = useState<CourseCatalogEntry | null>(null)
  const [editing, setEditing] = useState<CourseCatalogEntry | null>(null)
  const [archiving, setArchiving] = useState<CourseCatalogEntry | null>(null)

  const catalog = useCourseCatalog()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingSkeleton />

  if (catalog.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No courses yet"
        description="Add your first course to see it appear in the catalog."
      />
    )
  }

  const tableData = statusFilter === 'all' ? catalog : catalog.filter((c) => c.status === statusFilter)

  const columns: Column<CourseCatalogEntry>[] = [
    {
      key: 'title', label: 'Course', sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-w-950 max-w-60 truncate">{c.title}</p>
          <p className="text-xs text-w-600">{c.category}</p>
        </div>
      ),
    },
    { key: 'language', label: 'Language', sortable: true, render: (c) => <span className="text-w-700">{languageLabels[c.language]}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (c) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[c.status].cls}`}>
          {statusConfig[c.status].label}
        </span>
      ),
    },
    { key: 'enrolledCount', label: 'Enrolled', sortable: true, render: (c) => <span className="text-w-700">{c.enrolledCount}</span> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (c) => <span className="text-w-700">{c.createdAt}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => setViewing(c)} aria-label={`View ${c.title}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Eye size={14} />
          </button>
          <button onClick={() => setEditing(c)} aria-label={`Edit ${c.title}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => setArchiving(c)} aria-label={`Archive ${c.title}`} className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors">
            <Archive size={14} />
          </button>
        </div>
      ),
    },
  ]

  const statusSelect = (
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value as CourseStatus | 'all')}
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
    >
      <option value="all">All Statuses</option>
      {(Object.keys(statusConfig) as CourseStatus[]).map((s) => (
        <option key={s} value={s}>{statusConfig[s].label}</option>
      ))}
    </select>
  )

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Link href="/dashboard/e-learning/add" aria-label="Add a new course">
          <ElegantButton type="button" variant="primary" className="flex items-center gap-2 px-4 py-2 text-sm">
            <PlusCircle size={15} /> Add Course
          </ElegantButton>
        </Link>
      </div>

      <DataTable<CourseCatalogEntry>
        data={tableData}
        columns={columns}
        rowKey={(c) => c.id}
        searchPlaceholder="Search course or category..."
        searchFilter={(c, q) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)}
        filters={statusSelect}
        emptyMessage="No courses match your filters."
      />

      <CourseDetailModal course={viewing} onClose={() => setViewing(null)} />
      <EditCourseModal course={editing} onClose={() => setEditing(null)} />
      <ArchiveCourseModal
        course={archiving}
        onClose={() => setArchiving(null)}
        onConfirm={() => {
          if (archiving) archiveCourseInCatalog(archiving.id)
          setArchiving(null)
        }}
      />
    </div>
  )
}
