import { CheckCircle2, Circle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { kindConfig, type TakeableAssessment } from './quizzes-config'

interface QuizDetailModalProps {
  assessment: TakeableAssessment | null
  onClose: () => void
}

/** Read-only details view for a single quiz/exam, including its full question list. */
export function QuizDetailModal({ assessment, onClose }: QuizDetailModalProps) {
  const courseTitle = assessment ? courseCatalog.find((c) => c.id === assessment.courseId)?.title ?? 'Unknown course' : ''

  return (
    <Modal open={!!assessment} onClose={onClose} title="Quiz / Exam Details" size="lg">
      {assessment && (
        <div className="space-y-3">
          <div>
            <p className="font-cinzel text-sm font-semibold text-w-950">{assessment.title}</p>
            <p className="text-xs text-w-600 mt-0.5">{courseTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${kindConfig[assessment.kind].cls}`}>
              {kindConfig[assessment.kind].label}
            </span>
            {assessment.durationSeconds && (
              <span className="text-xs text-w-600">{Math.round(assessment.durationSeconds / 60)} min time limit</span>
            )}
          </div>

          <div className="space-y-2">
            {assessment.questions.map((q, i) => (
              <div key={q.id} className="bg-w-100 border border-w-300 rounded p-3">
                <p className="text-xs font-semibold text-w-950 mb-1.5">Q{i + 1}. {q.text} <span className="text-w-600 font-normal">({q.marks} marks)</span></p>
                {q.type === 'MCQ' && q.options ? (
                  <ul className="space-y-1">
                    {q.options.map((opt, oIndex) => (
                      <li key={oIndex} className={`flex items-center gap-1.5 text-xs ${oIndex === q.correctOptionIndex ? 'text-green-700 font-semibold' : 'text-w-700'}`}>
                        {oIndex === q.correctOptionIndex ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {opt}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-w-600 italic">Open-ended — requires manual review.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
