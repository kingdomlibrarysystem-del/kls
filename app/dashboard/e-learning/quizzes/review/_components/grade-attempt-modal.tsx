'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { useAssessmentCatalog } from '@/app/member/_shared/use-assessments'
import { gradeOpenAnswers } from '@/app/member/_shared/use-assessment-attempts'
import type { AssessmentAttempt } from '@/app/member/_shared/enrollment-data'

interface GradeAttemptModalProps {
  attempt: AssessmentAttempt | null
  onClose: () => void
  onGraded: (assessmentTitle: string) => void
}

/**
 * Grades every OPEN question on one PENDING_REVIEW attempt: shows each
 * question's scenario context, text, and the member's raw answer, with a
 * marks-bounded numeric score input per question. Confirming sums the
 * entered scores with the attempt's already-auto-graded score and calls
 * `gradeOpenAnswers`, which finalizes pass/fail and re-applies certificate
 * eligibility — the same path an auto-graded PASSED attempt already uses.
 */
export function GradeAttemptModal({ attempt, onClose, onGraded }: GradeAttemptModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const catalog = useAssessmentCatalog()

  const assessment = attempt ? catalog[attempt.assessmentId] : undefined
  const openQuestions = assessment?.questions.filter((q) => q.type === 'OPEN') ?? []

  useEffect(() => {
    if (attempt) {
      setScores(Object.fromEntries(openQuestions.map((q) => [q.id, 0])))
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  if (!attempt || !assessment) return null

  const setScoreFor = (questionId: string, value: number, maxMarks: number) => {
    const bounded = Math.max(0, Math.min(value, maxMarks))
    setScores((prev) => ({ ...prev, [questionId]: bounded }))
  }

  const handleConfirm = () => {
    try {
      if (openQuestions.some((q) => scores[q.id] === undefined)) {
        throw new Error('Enter a score for every open-ended question')
      }
      gradeOpenAnswers(attempt.assessmentId, assessment.courseId, scores, attempt.score, attempt.totalMarks)
      onGraded(assessment.title)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this grade')
    }
  }

  const openTotal = Object.values(scores).reduce((sum, s) => sum + s, 0)
  const finalScore = attempt.score + openTotal

  return (
    <Modal open onClose={onClose} title="Grade Open-Ended Answers" size="lg">
      <div className="space-y-3">
        <p className="font-lato text-sm text-w-700">
          <span className="font-semibold text-w-950">{assessment.title}</span> — auto-graded score so far: {attempt.score} / {attempt.totalMarks}
        </p>

        {openQuestions.map((q, i) => (
          <div key={q.id} className="bg-w-100 border border-w-300 rounded p-3 space-y-2">
            {q.context && <p className="text-xs text-w-600 italic">{q.context}</p>}
            <p className="text-xs font-semibold text-w-950">Q{i + 1}. {q.text} <span className="text-w-600 font-normal">({q.marks} marks)</span></p>
            <div className="bg-white border border-w-300 rounded p-2">
              <p className="text-xs text-w-700 whitespace-pre-wrap">{attempt.openAnswers?.[q.id] || <span className="italic text-w-500">No answer submitted.</span>}</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor={`score-${q.id}`} className="text-xs font-lato font-semibold text-w-700">Score</label>
              <input
                id={`score-${q.id}`}
                type="number"
                min={0}
                max={q.marks}
                value={scores[q.id] ?? 0}
                onChange={(e) => setScoreFor(q.id, Number(e.target.value), q.marks)}
                aria-label={`Score for question ${i + 1}, out of ${q.marks}`}
                className="w-20 px-2 py-1 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
              />
              <span className="text-xs text-w-600">/ {q.marks}</span>
            </div>
          </div>
        ))}

        <p className="font-lato text-sm text-w-950 font-semibold">Final score: {finalScore} / {attempt.totalMarks}</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded font-lato text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <ElegantButton type="button" variant="primary" onClick={handleConfirm}>
            <CheckCircle size={14} className="inline-block mr-1" /> Save Grade
          </ElegantButton>
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}
