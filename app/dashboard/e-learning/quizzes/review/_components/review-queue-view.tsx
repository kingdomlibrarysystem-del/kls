'use client'

import { useState } from 'react'
import { ClipboardCheck, Clock, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAssessmentCatalog } from '@/app/member/_shared/use-assessments'
import { useCourseCatalog } from '../../../_shared/use-course-catalog'
import { useAttemptsAdmin, type AttemptRecord } from './use-attempts-admin'
import { GradeAttemptModal } from './grade-attempt-modal'

/**
 * Admin review queue for anything a manager must manually grade: OPEN-
 * question answers and PROJECT (hackathon-style) submissions alike, since
 * both land as PENDING_REVIEW. Reads the real AssessmentAttempt
 * collection — grading is an admin-only action with no dependency on a
 * real "current user" for the grader, so this surface is fully real
 * even though the member's own take-quiz submission path is not yet
 * (see PROGRESS.md's Phase 5 entry).
 */
export function ReviewQueueView() {
  const [grading, setGrading] = useState<AttemptRecord | null>(null)
  const [toast, setToast] = useState('')

  const { data: attempts, loading: attemptsLoading, error: attemptsError } = useAttemptsAdmin()
  const { data: catalog, loading: catalogLoading, error: catalogError } = useAssessmentCatalog()
  const { data: courseCatalog } = useCourseCatalog()

  const loading = attemptsLoading || catalogLoading
  const error = attemptsError ?? catalogError

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

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load the review queue" description={error} />
  }

  const pending = attempts.filter((a) => a.reviewStatus === 'PENDING_REVIEW')

  const courseTitleFor = (assessmentId: string) => {
    const assessment = catalog[assessmentId]
    return courseCatalog.find((c) => c.id === assessment?.courseId)?.title ?? 'Unknown course'
  }

  const columns: Column<AttemptRecord>[] = [
    {
      key: 'assessmentId', label: 'Assessment', sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-w-950 max-w-60 truncate">{catalog[a.assessmentId]?.title ?? a.assessmentId}</p>
          <p className="text-xs text-w-600">{courseTitleFor(a.assessmentId)}</p>
        </div>
      ),
    },
    { key: 'takenAt', label: 'Submitted', sortable: true, render: (a) => <span className="text-w-700">{a.takenAt}</span> },
    {
      key: 'score', label: 'Auto-graded so far', sortable: true,
      render: (a) => <span className="text-w-700">{a.score} / {a.totalMarks}</span>,
    },
    {
      key: 'openCount', label: 'Pending Review', render: (a) => {
        const isProject = catalog[a.assessmentId]?.kind === 'PROJECT'
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-lato">
            <Clock size={11} /> {isProject ? 'Project submission' : `${Object.keys(a.openAnswers ?? {}).length} open question(s)`}
          </span>
        )
      },
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
        <EmptyState icon={ClipboardCheck} title="Review queue is empty" description="No open-ended answers or project submissions are awaiting review." />
      ) : (
        <DataTable<AttemptRecord>
          data={pending}
          columns={columns}
          rowKey={(a) => a.id}
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
