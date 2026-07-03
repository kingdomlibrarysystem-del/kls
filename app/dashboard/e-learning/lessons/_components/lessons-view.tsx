'use client'

import { useState, useEffect } from 'react'
import { Video, Eye, Pencil, Trash2, PlusCircle, ArrowUp, ArrowDown } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useLessonsByCourse, reorderLesson } from '@/app/member/_shared/use-lessons'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { contentTypeConfig, type LessonRow } from './lessons-config'
import { AddLessonModal } from './add-lesson-modal'
import { LessonDetailModal } from './lesson-detail-modal'
import { EditLessonModal } from './edit-lesson-modal'
import { DeleteLessonModal } from './delete-lesson-modal'

/** Simulated network delay before the lesson catalog becomes visible. */
const LOAD_DELAY_MS = 400

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading lessons">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

/**
 * Admin Lessons management: a flattened, filterable table of every lesson
 * across all 12 catalog courses, backed by the shared `/member/_shared`
 * lesson store so admin edits are immediately visible to the member lesson
 * viewer taking the same course.
 */
export function LessonsView() {
  const [loading, setLoading] = useState(true)
  const [courseFilter, setCourseFilter] = useState<string | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [viewing, setViewing] = useState<LessonRow | null>(null)
  const [editing, setEditing] = useState<LessonRow | null>(null)
  const [deleting, setDeleting] = useState<LessonRow | null>(null)

  const lessonsByCourse = useLessonsByCourse()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <LoadingSkeleton />

  const allRows: LessonRow[] = Object.values(lessonsByCourse).flatMap((course) =>
    course.lessons.map((lesson, index) => ({
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      lessonId: lesson.id,
      order: index + 1,
      title: lesson.title,
      contentType: lesson.contentType,
      durationMinutes: lesson.durationMinutes,
      content: lesson.content,
    }))
  )

  if (allRows.length === 0) {
    return (
      <EmptyState icon={Video} title="No lessons yet" description="Add a lesson to a course to see it appear here." />
    )
  }

  const tableData = courseFilter === 'all' ? allRows : allRows.filter((r) => r.courseId === courseFilter)
  const courseLessonCount = (courseId: string) => lessonsByCourse[courseId]?.lessons.length ?? 0

  const columns: Column<LessonRow>[] = [
    {
      key: 'title', label: 'Lesson', sortable: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-w-950 max-w-60 truncate">{r.title}</p>
          <p className="text-xs text-w-600">{r.courseTitle}</p>
        </div>
      ),
    },
    { key: 'order', label: 'Order', sortable: true, render: (r) => <span className="text-w-700">#{r.order}</span> },
    {
      key: 'contentType', label: 'Type', sortable: true,
      render: (r) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${contentTypeConfig[r.contentType].cls}`}>
          {contentTypeConfig[r.contentType].label}
        </span>
      ),
    },
    { key: 'durationMinutes', label: 'Duration', sortable: true, render: (r) => <span className="text-w-700">{r.durationMinutes} min</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => reorderLesson(r.courseId, r.lessonId, 'up')} disabled={r.order === 1} aria-label={`Move ${r.title} up`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors disabled:opacity-30 disabled:pointer-events-none">
            <ArrowUp size={13} />
          </button>
          <button onClick={() => reorderLesson(r.courseId, r.lessonId, 'down')} disabled={r.order === courseLessonCount(r.courseId)} aria-label={`Move ${r.title} down`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors disabled:opacity-30 disabled:pointer-events-none">
            <ArrowDown size={13} />
          </button>
          <button onClick={() => setViewing(r)} aria-label={`View ${r.title}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Eye size={14} />
          </button>
          <button onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => setDeleting(r)} aria-label={`Delete ${r.title}`} className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  const courseSelect = (
    <select
      value={courseFilter}
      onChange={(e) => setCourseFilter(e.target.value)}
      aria-label="Filter by course"
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
    >
      <option value="all">All Courses</option>
      {courseCatalog.map((c) => (
        <option key={c.id} value={c.id}>{c.title}</option>
      ))}
    </select>
  )

  return (
    <div>
      <div className="flex justify-end mb-3">
        <ElegantButton type="button" variant="primary" className="flex items-center gap-2 px-4 py-2 text-sm" onClick={() => setAdding(true)}>
          <PlusCircle size={15} /> Add Lesson
        </ElegantButton>
      </div>

      <DataTable<LessonRow>
        data={tableData}
        columns={columns}
        rowKey={(r) => `${r.courseId}-${r.lessonId}`}
        searchPlaceholder="Search lesson or course..."
        searchFilter={(r, q) => r.title.toLowerCase().includes(q) || r.courseTitle.toLowerCase().includes(q)}
        filters={courseSelect}
        emptyMessage="No lessons match your filters."
      />

      <AddLessonModal open={adding} onClose={() => setAdding(false)} />
      <LessonDetailModal lesson={viewing} onClose={() => setViewing(null)} />
      <EditLessonModal lesson={editing} onClose={() => setEditing(null)} />
      <DeleteLessonModal lesson={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}
