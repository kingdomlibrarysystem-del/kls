'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileX, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CountdownTimer } from './countdown-timer'
import { QuestionNavigator } from './question-navigator'
import { ResultsScreen } from './results-screen'
import { recordAssessmentAttempt } from '../../../../_shared/use-enrollments'
import { useAssessmentCatalog } from '../../../../_shared/use-assessments'

/** Simulated network delay before the mock assessment becomes visible. */
const LOAD_DELAY_MS = 400

interface TakeAssessmentViewProps {
  assessmentId: string
}

interface AnswerState {
  optionIndex?: number
  openText?: string
}

/**
 * Quiz/exam-taking flow: question-by-question navigation, an exam-only
 * countdown timer that auto-submits at zero, and a results screen scoring
 * MCQs immediately (open-ended questions are marked pending review).
 */
export function TakeAssessmentView({ assessmentId }: TakeAssessmentViewProps) {
  const [loading, setLoading] = useState(true)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<{ score: number; totalMarks: number } | null>(null)

  const assessmentCatalog = useAssessmentCatalog()
  const assessment = assessmentCatalog[assessmentId]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (assessment?.kind === 'EXAM' && assessment.durationSeconds) {
        setSecondsRemaining(assessment.durationSeconds)
      }
      setLoading(false)
    }, LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [assessment])

  const handleSubmit = useCallback((expired: boolean) => {
    try {
      if (!assessment) throw new Error('Assessment not found')
      const totalMarks = assessment.questions.reduce((sum, q) => sum + q.marks, 0)
      const score = assessment.questions.reduce((sum, q) => {
        if (q.type !== 'MCQ') return sum
        const answer = answers[q.id]
        return answer?.optionIndex === q.correctOptionIndex ? sum + q.marks : sum
      }, 0)
      recordAssessmentAttempt(assessment.id, assessment.courseId, score, totalMarks)
      setResult({ score, totalMarks })
      setAutoSubmitted(expired)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit assessment')
    }
  }, [assessment, answers])

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading assessment">
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 220, borderRadius: 8 }} />
      </div>
    )
  }

  if (!assessment) {
    return <EmptyState icon={FileX} title="Assessment not found" description="This assessment doesn't exist in the mock catalog." style={{ color: 'var(--text-secondary)' }} />
  }

  if (submitted && result) {
    return <ResultsScreen assessment={assessment} score={result.score} totalMarks={result.totalMarks} autoSubmitted={autoSubmitted} />
  }

  const question = assessment.questions[questionIndex]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{assessment.title}</h1>
        {assessment.kind === 'EXAM' && (
          <CountdownTimer
            secondsRemaining={secondsRemaining}
            onTick={setSecondsRemaining}
            onExpire={() => handleSubmit(true)}
          />
        )}
      </div>

      {submitError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 12 }}>
          <AlertCircle size={13} /> {submitError}
        </div>
      )}

      <QuestionNavigator
        question={question}
        index={questionIndex}
        total={assessment.questions.length}
        selectedOptionIndex={answers[question.id]?.optionIndex}
        openAnswer={answers[question.id]?.openText}
        onSelectOption={(optionIndex) => setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], optionIndex } }))}
        onOpenAnswerChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], openText: value } }))}
        onPrev={() => setQuestionIndex((i) => Math.max(0, i - 1))}
        onNext={() => setQuestionIndex((i) => Math.min(assessment.questions.length - 1, i + 1))}
        onSubmit={() => handleSubmit(false)}
      />
    </div>
  )
}
