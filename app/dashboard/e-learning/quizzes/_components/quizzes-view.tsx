'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ClipboardList, ClipboardCheck, Eye, Pencil, Trash2, PlusCircle, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { ElegantButton } from '@/components/ui/elegant-button'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAssessmentCatalog } from '@/app/member/_shared/use-assessments'
import { useAttemptsAdmin } from '../review/_components/use-attempts-admin'
import { useCourseCatalog } from '../../_shared/use-course-catalog'
import { kindConfig, type TakeableAssessment, type AssessmentKind } from './quizzes-config'
import { AddQuizModal } from './add-quiz-modal'
import { EditQuizModal } from './edit-quiz-modal'
import { DeleteQuizModal } from './delete-quiz-modal'

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading quizzes and exams">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  )
}

/**
 * Admin Quizzes & Exams management: lists every quiz/exam across the
 * catalog, backed by the real Assessment collection so admin edits are
 * immediately visible to the member take-assessment flow.
 */
export function QuizzesView() {
  const [kindFilter, setKindFilter] = useState<AssessmentKind | 'all'>('all')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<TakeableAssessment | null>(null)
  const [deleting, setDeleting] = useState<TakeableAssessment | null>(null)

  const { data: catalog, loading: catalogLoading, error: catalogError } = useAssessmentCatalog()
  const { data: attempts, loading: attemptsLoading } = useAttemptsAdmin()
  const { data: courseCatalog } = useCourseCatalog()
  const pendingReviewCount = attempts.filter((a) => a.reviewStatus === 'PENDING_REVIEW').length

  const loading = catalogLoading || attemptsLoading

  function courseTitleFor(courseId: string) {
    return courseCatalog.find((c) => c.id === courseId)?.title ?? 'Unknown course'
  }

  if (loading) return <LoadingSkeleton />

  if (catalogError) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load quizzes and exams" description={catalogError} />
  }

  const allAssessments = Object.values(catalog)

  if (allAssessments.length === 0) {
    return <EmptyState icon={ClipboardList} title="No quizzes or exams yet" description="Add a quiz or exam to a course to see it appear here." />
  }

  const tableData = kindFilter === 'all' ? allAssessments : allAssessments.filter((a) => a.kind === kindFilter)

  const columns: Column<TakeableAssessment>[] = [
    {
      key: 'title', label: 'Title', sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-w-950 max-w-60 truncate">{a.title}</p>
          <p className="text-xs text-w-600">{courseTitleFor(a.courseId)}</p>
        </div>
      ),
    },
    {
      key: 'kind', label: 'Type', sortable: true,
      render: (a) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${kindConfig[a.kind].cls}`}>
          {kindConfig[a.kind].label}
        </span>
      ),
    },
    { key: 'questions', label: 'Questions', sortable: true, render: (a) => <span className="text-w-700">{a.questions.length}</span> },
    {
      key: 'durationSeconds', label: 'Time Limit', sortable: true,
      render: (a) => <span className="text-w-700">{a.durationSeconds ? `${Math.round(a.durationSeconds / 60)} min` : '—'}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <UniversalButton
            href={`/dashboard/e-learning/quizzes/${a.id}`}
            variant="ghost"
            size="icon"
            aria-label={`View ${a.title}`}
            className="text-w-700 hover:bg-w-100 hover:text-w-950"
            icon={<Eye size={14} />}
          />
          <button onClick={() => setEditing(a)} aria-label={`Edit ${a.title}`} className="p-1.5 rounded text-w-700 hover:bg-w-100 hover:text-w-950 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => setDeleting(a)} aria-label={`Delete ${a.title}`} className="p-1.5 rounded text-w-700 hover:bg-red-50 hover:text-red-700 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  const kindSelect = (
    <select
      value={kindFilter}
      onChange={(e) => setKindFilter(e.target.value as AssessmentKind | 'all')}
      aria-label="Filter by type"
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
    >
      <option value="all">All Types</option>
      {(Object.keys(kindConfig) as AssessmentKind[]).map((k) => (
        <option key={k} value={k}>{kindConfig[k].label}</option>
      ))}
    </select>
  )

  return (
    <div>
      <div className="flex justify-end items-center gap-2 mb-3">
        <Link
          href="/dashboard/e-learning/quizzes/review"
          className="flex items-center gap-2 px-4 py-2 text-sm font-lato font-semibold border border-w-400 rounded text-w-700 hover:bg-w-100 transition-colors"
        >
          <ClipboardCheck size={15} /> Review Queue
          {pendingReviewCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{pendingReviewCount}</span>
          )}
        </Link>
        <ElegantButton type="button" variant="primary" className="flex items-center gap-2 px-4 py-2 text-sm" onClick={() => setAdding(true)}>
          <PlusCircle size={15} /> Add Quiz / Exam
        </ElegantButton>
      </div>

      <DataTable<TakeableAssessment>
        data={tableData}
        columns={columns}
        rowKey={(a) => a.id}
        searchPlaceholder="Search title or course..."
        searchFilter={(a, q) => a.title.toLowerCase().includes(q) || courseTitleFor(a.courseId).toLowerCase().includes(q)}
        filters={kindSelect}
        emptyMessage="No quizzes or exams match your filters."
      />

      <AddQuizModal open={adding} onClose={() => setAdding(false)} />
      <EditQuizModal assessment={editing} onClose={() => setEditing(null)} />
      <DeleteQuizModal assessment={deleting} onClose={() => setDeleting(null)} />
    </div>
  )
}
