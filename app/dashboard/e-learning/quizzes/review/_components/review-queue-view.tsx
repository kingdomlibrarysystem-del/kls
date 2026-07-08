'use client'

import { useState, useEffect } from 'react'
import { ClipboardCheck, Clock } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAssessmentAttempts } from '@/app/member/_shared/use-assessment-attempts'
import { useAssessmentCatalog } from '@/app/member/_shared/use-assessments'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import type { AssessmentAttempt } from '@/app/member/_shared/enrollment-data'
import { GradeAttemptModal } from './grade-attempt-modal'

/** Simulated network delay before the shared attempt store's initial snapshot is shown. */
const LOAD_DELAY_MS = 400

/** This mock has a single member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
const MEMBER_NAME = 'John Doe'

/**
 * Admin review queue for OPEN-question assessment attempts: lists every
 * PENDING_REVIEW attempt, and opens `GradeAttemptModal` to score each
 * open-ended answer — grading transitions the attempt to GRADED, which
 * flows back into the member's Assessment History and, if it completes
 * the course, certificate eligibility (see gradeOpenAnswers docstring).
 */
export function ReviewQueueView() {
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<AssessmentAttempt | null>(null)
  const [toast, setToast] = useState('')

  const attempts = useAssessmentAttempts()
  const catalog = useAssessmentCatalog()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading review queue">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const pending = attempts.filter((a) => a.reviewStatus === 'PENDING_REVIEW')

  const courseTitleFor = (assessmentId: string) => {
    const assessment = catalog[assessmentId]
    return courseCatalog.find((c) => c.id === assessment?.courseId)?.title ?? 'Unknown course'
  }

  const columns: Column<AssessmentAttempt>[] = [
    {
      key: 'assessmentId', label: 'Assessment', sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-w-950 max-w-60 truncate">{catalog[a.assessmentId]?.title ?? a.assessmentId}</p>
          <p className="text-xs text-w-600">{courseTitleFor(a.assessmentId)}</p>
        </div>
      ),
    },
    { key: 'member', label: 'Member', render: () => <span className="text-w-700">{MEMBER_NAME}</span> },
    { key: 'takenAt', label: 'Submitted', sortable: true, render: (a) => <span className="text-w-700">{a.takenAt}</span> },
    {
      key: 'score', label: 'Auto-graded so far', sortable: true,
      render: (a) => <span className="text-w-700">{a.score} / {a.totalMarks}</span>,
    },
    {
      key: 'openCount', label: 'Open Questions', render: (a) => (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-lato">
          <Clock size={11} /> {Object.keys(a.openAnswers ?? {}).length} pending
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => setGrading(a)}
            aria-label={`Grade ${catalog[a.assessmentId]?.title ?? a.assessmentId}`}
            className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-700 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"
          >
            <ClipboardCheck size={12} /> Grade
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {toast && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">
          {toast}
        </div>
      )}

      {pending.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Review queue is empty" description="No open-ended assessment answers are awaiting review." />
      ) : (
        <DataTable<AssessmentAttempt>
          data={pending}
          columns={columns}
          rowKey={(a) => a.assessmentId}
          searchPlaceholder="Search assessment title..."
          searchFilter={(a, q) => (catalog[a.assessmentId]?.title ?? '').toLowerCase().includes(q)}
          emptyMessage="No pending attempts match your search."
        />
      )}

      <GradeAttemptModal
        attempt={grading}
        onClose={() => setGrading(null)}
        onGraded={(title) => { showToast(`Graded "${title}" — the member's results are now finalized.`); setGrading(null) }}
      />
    </div>
  )
}
