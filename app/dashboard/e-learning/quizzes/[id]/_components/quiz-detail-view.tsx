'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Circle, ClipboardX, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { projectSubmissionFormatLabels } from '@/app/member/_shared/assessment-data'
import { kindConfig, type TakeableAssessment } from '../../_components/quizzes-config'
import { EditQuizModal } from '../../_components/edit-quiz-modal'
import { DeleteQuizModal } from '../../_components/delete-quiz-modal'

interface QuizDetailViewProps {
  /** GET /api/assessments/[id] shape, loaded on the server by page.tsx (which 404s when missing). */
  initialAssessment: TakeableAssessment
  /** Parent course title, resolved server-side (instead of loading the whole course catalog). */
  courseTitle: string
}

/**
 * Real details page for a single quiz/exam/project, replacing the modal
 * that used to open from the Quizzes & Exams table's "View" button.
 * The assessment and its course title arrive from the server page.
 */
export function QuizDetailView({ initialAssessment, courseTitle }: QuizDetailViewProps) {
  const id = initialAssessment.id
  const router = useRouter()
  const assessment: TakeableAssessment | null = initialAssessment
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteModalClose = async () => {
    setDeleting(false)
    const res = await fetch(`/api/assessments/${id}`)
    if (res.status === 404) {
      router.push('/dashboard/e-learning/quizzes')
    }
  }

  if (!assessment) {
    return (
      <div>
        <PageHeader title="Quiz / Exam Details" />
        <EmptyState icon={ClipboardX} title="Quiz/exam not found" description="This quiz/exam does not exist or was deleted." />
        <div className="mt-4">
          <UniversalButton href="/dashboard/e-learning/quizzes" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Quizzes & Exams
          </UniversalButton>
        </div>
      </div>
    )
  }

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
                        <li key={oIndex} className={`flex items-center gap-1.5 text-xs ${isCorrect ? 'text-green-700 dark:text-success font-semibold' : 'text-w-700'}`}>
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
