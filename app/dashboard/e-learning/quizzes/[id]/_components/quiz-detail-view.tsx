'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Circle, ClipboardX, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useCourseCatalog } from '../../../_shared/use-course-catalog'
import { projectSubmissionFormatLabels } from '@/app/member/_shared/assessment-data'
import { kindConfig, type TakeableAssessment } from '../../_components/quizzes-config'
import { EditQuizModal } from '../../_components/edit-quiz-modal'
import { DeleteQuizModal } from '../../_components/delete-quiz-modal'

interface QuizDetailViewProps {
  id: string
}

/**
 * Real details page for a single quiz/exam/project, replacing the modal
 * that used to open from the Quizzes & Exams table's "View" button.
 * Fetches directly from /api/assessments/:id so this page also works
 * when linked to directly, without the admin catalog list being loaded
 * first.
 */
export function QuizDetailView({ id }: QuizDetailViewProps) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<TakeableAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { data: courseCatalog } = useCourseCatalog()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/assessments/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Quiz/exam not found')
          return
        }
        setAssessment(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load quiz/exam') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const handleDeleteModalClose = async () => {
    setDeleting(false)
    const res = await fetch(`/api/assessments/${id}`)
    if (res.status === 404) {
      router.push('/dashboard/e-learning/quizzes')
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Quiz / Exam Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div>
        <PageHeader title="Quiz / Exam Details" />
        <EmptyState icon={ClipboardX} title="Quiz/exam not found" description={error || 'This quiz/exam does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/quizzes" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Quizzes & Exams
          </UniversalButton>
        </div>
      </div>
    )
  }

  const courseTitle = courseCatalog.find((c) => c.id === assessment.courseId)?.title ?? 'Unknown course'

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/e-learning/quizzes" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Quizzes & Exams
        </UniversalButton>
        <div className="flex gap-2">
          <UniversalButton variant="outline" size="sm" icon={<Pencil size={13} />} onClick={() => setEditing(true)}>
            Edit
          </UniversalButton>
          <UniversalButton variant="destructive" size="sm" icon={<Trash2 size={13} />} onClick={() => setDeleting(true)}>
            Delete
          </UniversalButton>
        </div>
      </div>

      <div className="max-w-2xl space-y-3">
        <div>
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{assessment.title}</h1>
          <p className="font-lato text-sm text-w-600 mt-0.5">{courseTitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${kindConfig[assessment.kind].cls}`}>
            {kindConfig[assessment.kind].label}
          </span>
          {assessment.durationSeconds && (
            <span className="text-xs text-w-600">{Math.round(assessment.durationSeconds / 60)} min time limit</span>
          )}
        </div>

        {assessment.kind === 'PROJECT' ? (
          <div className="bg-w-100 border border-w-300 rounded p-3 space-y-2">
            <p className="text-xs font-semibold text-w-950">Brief</p>
            <p className="text-xs text-w-700 whitespace-pre-wrap">{assessment.brief}</p>
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-w-600">
                Submission format: <span className="font-semibold text-w-950">{assessment.submissionFormat ? projectSubmissionFormatLabels[assessment.submissionFormat] : '—'}</span>
              </span>
              <span className="text-xs text-w-600">
                Total marks: <span className="font-semibold text-w-950">{assessment.projectMarks ?? '—'}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {assessment.questions.map((q, i) => (
              <div key={q.id} className="bg-w-100 border border-w-300 rounded p-3">
                {q.context && <p className="text-xs text-w-600 italic mb-1.5">{q.context}</p>}
                <p className="text-xs font-semibold text-w-950 mb-1.5">Q{i + 1}. {q.text} <span className="text-w-600 font-normal">({q.marks} marks)</span></p>
                {(q.type === 'SINGLE_SELECT' || q.type === 'MULTI_SELECT') && q.options ? (
                  <ul className="space-y-1">
                    {q.options.map((opt, oIndex) => {
                      const isCorrect = q.type === 'SINGLE_SELECT' ? oIndex === q.correctOptionIndex : (q.correctOptionIndices ?? []).includes(oIndex)
                      return (
                        <li key={oIndex} className={`flex items-center gap-1.5 text-xs ${isCorrect ? 'text-green-700 font-semibold' : 'text-w-700'}`}>
                          {isCorrect ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                          {opt}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-w-600 italic">Open-ended — requires manual review.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <EditQuizModal assessment={editing ? assessment : null} onClose={() => setEditing(false)} />
      <DeleteQuizModal assessment={deleting ? assessment : null} onClose={handleDeleteModalClose} />
    </div>
  )
}
