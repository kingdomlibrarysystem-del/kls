'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileX, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { CountdownTimer } from './countdown-timer'
import { QuestionNavigator } from './question-navigator'
import { ResultsScreen } from './results-screen'
import { ProjectSubmissionView } from './project-submission-view'
import { recordAssessmentAttempt, type SubmittedAnswer, type AssessmentAttempt } from '../../../../_shared/use-assessment-attempts'
import { useAssessmentCatalog } from '../../../../_shared/use-assessments'

interface TakeAssessmentViewProps {
  assessmentId: string
}

/**
 * Entry point for taking any assessment kind. QUIZ/EXAM render
 * question-by-question navigation (with an exam-only countdown timer that
 * auto-submits at zero); PROJECT branches early to `ProjectSubmissionView`
 * — a single brief + one submission field, never touching
 * `QuestionNavigator`/`CountdownTimer` at all, since a project has no
 * question list and is never timed. The results screen reflects the
 * recorded attempt's real review status in all cases: auto-graded single-/
 * multi-select questions score immediately, while any attempt containing
 * an OPEN question or any PROJECT submission is recorded as PENDING_REVIEW
 * (its answer text persisted, not discarded) until a manager grades it.
 */
export function TakeAssessmentView({ assessmentId }: TakeAssessmentViewProps) {
  const { user } = useAuth()
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, SubmittedAnswer>>({})
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState<AssessmentAttempt | null>(null)

  const { data: assessmentCatalog, loading } = useAssessmentCatalog()
  const assessment = assessmentCatalog[assessmentId]

  useEffect(() => {
    if (assessment?.kind === 'EXAM' && assessment.durationSeconds) {
      setSecondsRemaining(assessment.durationSeconds)
    }
  }, [assessment])

  const handleSubmit = useCallback(async (expired: boolean) => {
    try {
      if (!assessment) throw new Error('Assessment not found')
      if (!user) throw new Error('You must be signed in to submit an assessment')
      const attempt = await recordAssessmentAttempt(user.id, assessment.id, answers)
      setResult(attempt)
      setAutoSubmitted(expired)
      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit assessment')
    }
  }, [assessment, answers, user])

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading assessment">
        <Skeleton style={{ height: 40, borderRadius: 8 }} />
        <Skeleton style={{ height: 220, borderRadius: 8 }} />
      </div>
    )
  }

  if (!assessment) {
    return <EmptyState icon={FileX} title="Assessment not found" description="This assessment doesn't exist in the catalog." style={{ color: 'var(--text-secondary)' }} />
  }

  if (submitted && result) {
    return <ResultsScreen assessment={assessment} attempt={result} autoSubmitted={autoSubmitted} />
  }

  if (assessment.kind === 'PROJECT') {
    return <ProjectSubmissionView assessment={assessment} onSubmitted={(attempt) => { setResult(attempt); setSubmitted(true) }} />
  }

  const question = assessment.questions[questionIndex]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="cinzel" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{assessment.title}</h1>
        {assessment.kind === 'EXAM' && secondsRemaining !== null && (
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
        selectedOptionIndices={answers[question.id]?.optionIndices}
        openAnswer={answers[question.id]?.openText}
        onSelectOption={(optionIndex) => setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], optionIndex } }))}
        onToggleMultiOption={(optionIndex) => setAnswers((prev) => {
          const current = prev[question.id]?.optionIndices ?? []
          const next = current.includes(optionIndex) ? current.filter((i) => i !== optionIndex) : [...current, optionIndex]
          return { ...prev, [question.id]: { ...prev[question.id], optionIndices: next } }
        })}
        onOpenAnswerChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: { ...prev[question.id], openText: value } }))}
        onPrev={() => setQuestionIndex((i) => Math.max(0, i - 1))}
        onNext={() => setQuestionIndex((i) => Math.min(assessment.questions.length - 1, i + 1))}
        onSubmit={() => handleSubmit(false)}
      />
    </div>
  )
}
