'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Send, CheckCircle2, AlertCircle, ClipboardList } from 'lucide-react'
import { recordAssessmentAttempt, type SubmittedAnswer } from '../../../../../_shared/use-assessment-attempts'
import type { TakeableAssessment } from '../../../../../_shared/assessment-data'
import { useAuth } from '@/contexts/auth-context'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

interface LessonQuizInlineProps {
  assessment: TakeableAssessment
}

export function LessonQuizInline({ assessment }: LessonQuizInlineProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, SubmittedAnswer>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [score, setScore] = useState<{ earned: number; total: number } | null>(null)

  const handleSubmit = useCallback(async () => {
    try {
      if (!user) throw new Error('You must be signed in')
      const attempt = await recordAssessmentAttempt(user.id, assessment.id, answers)
      setScore({ earned: attempt.score ?? 0, total: attempt.totalMarks ?? assessment.questions.reduce((s, q) => s + q.marks, 0) })
      setSubmitted(true)
      setSubmitError('')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not submit')
    }
  }, [user, assessment, answers])

  const matchingAnswersFor = (openText?: string): Record<number, number> => {
    if (!openText) return {}
    try { return JSON.parse(openText) as Record<number, number> } catch { return {} }
  }

  const kindLabel = assessment.kind === 'TEST' ? 'Lesson Test' : 'Lesson Quiz'

  return (
    <div style={{ marginTop: 24, border: '1px solid var(--gold)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(212,168,67,0.07)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        aria-expanded={open}
      >
        <ClipboardList size={18} color="var(--gold)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1, textTransform: 'uppercase' }}>{kindLabel}</span>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 1 }}>{assessment.title}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''} · optional</span>
        </span>
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>

      {open && (
        <div style={{ padding: 16, borderTop: '1px solid rgba(212,168,67,0.3)' }}>
          {submitted && score ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={36} color="var(--gold)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {score.earned} / {score.total} marks
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {score.earned === score.total ? 'Perfect score!' : score.earned >= score.total * 0.7 ? 'Well done!' : 'Keep studying — you can retake this later.'}
              </p>
            </div>
          ) : (
            <QuizBody
              assessment={assessment}
              questionIndex={questionIndex}
              answers={answers}
              submitError={submitError}
              onSetIndex={setQuestionIndex}
              onSetAnswers={setAnswers}
              onSubmit={handleSubmit}
              matchingAnswersFor={matchingAnswersFor}
            />
          )}
        </div>
      )}
    </div>
  )
}

interface QuizBodyProps {
  assessment: TakeableAssessment
  questionIndex: number
  answers: Record<string, SubmittedAnswer>
  submitError: string
  onSetIndex: (i: number) => void
  onSetAnswers: (fn: (prev: Record<string, SubmittedAnswer>) => Record<string, SubmittedAnswer>) => void
  onSubmit: () => void
  matchingAnswersFor: (t?: string) => Record<number, number>
}

function QuizBody({ assessment, questionIndex, answers, submitError, onSetIndex, onSetAnswers, onSubmit, matchingAnswersFor }: QuizBodyProps) {
  const question = assessment.questions[questionIndex]
  const total = assessment.questions.length
  const isLast = questionIndex === total - 1

  const fixedOptions: string[] | null =
    question.type === 'YES_NO' ? ['Yes', 'No'] :
    question.type === 'TRUE_FALSE' ? ['True', 'False'] :
    null

  const radioOptions = (question.type === 'SINGLE_SELECT' || fixedOptions) ? (question.options ?? fixedOptions ?? []) : null
  const selectedOption = answers[question.id]?.optionIndex
  const selectedOptions = answers[question.id]?.optionIndices ?? []
  const openText = answers[question.id]?.openText
  const matchingAnswers = matchingAnswersFor(openText)

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
        Question {questionIndex + 1} of {total} · {question.marks} mark{question.marks !== 1 ? 's' : ''}
      </p>

      {question.context && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10, padding: '8px 10px', background: 'var(--bg-section)', borderRadius: 6 }}>
          {question.context}
        </p>
      )}

      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>{question.text}</p>

      {/* SINGLE_SELECT / YES_NO / TRUE_FALSE */}
      {radioOptions && (
        <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {radioOptions.map((opt, i) => {
            const sel = selectedOption === i
            return (
              <button key={opt} role="radio" aria-checked={sel}
                onClick={() => onSetAnswers((p) => ({ ...p, [question.id]: { ...p[question.id], optionIndex: i } }))}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  textAlign: 'left', padding: '9px 12px', borderRadius: 6, border: 'none',
                  background: sel ? 'rgba(212,168,67,0.12)' : 'transparent',
                  cursor: 'pointer', width: '100%',
                }}
              >
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: sel ? 'var(--gold)' : 'rgba(212,168,67,0.15)',
                  color: sel ? '#1a1200' : 'var(--gold)',
                }}>
                  {LETTERS[i]}
                </span>
                <span style={{ fontSize: 14, color: sel ? 'var(--gold)' : 'var(--text-secondary)', lineHeight: 1.5, paddingTop: 2 }}>{opt}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* MULTI_SELECT */}
      {question.type === 'MULTI_SELECT' && question.options && (
        <div role="group" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {question.options.map((opt, i) => {
            const sel = selectedOptions.includes(i)
            return (
              <button key={opt} role="checkbox" aria-checked={sel}
                onClick={() => onSetAnswers((p) => {
                  const cur = p[question.id]?.optionIndices ?? []
                  return { ...p, [question.id]: { ...p[question.id], optionIndices: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] } }
                })}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  textAlign: 'left', padding: '9px 12px', borderRadius: 6, border: 'none',
                  background: sel ? 'rgba(212,168,67,0.12)' : 'transparent',
                  cursor: 'pointer', width: '100%',
                }}
              >
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: sel ? 'var(--gold)' : 'rgba(212,168,67,0.15)',
                  color: sel ? '#1a1200' : 'var(--gold)',
                }}>
                  {LETTERS[i]}
                </span>
                <span style={{ fontSize: 14, color: sel ? 'var(--gold)' : 'var(--text-secondary)', lineHeight: 1.5, paddingTop: 2 }}>{opt}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* MATCHING */}
      {question.type === 'MATCHING' && question.matchingPairs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Match each item on the left to its pair on the right</p>
          {question.matchingPairs.map((pair, li) => (
            <div key={li} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', padding: '8px 10px', background: 'var(--bg-section)', borderRadius: 6 }}>{pair.left}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
              <select
                aria-label={`Match for "${pair.left}"`}
                value={matchingAnswers[li] ?? ''}
                onChange={(e) => onSetAnswers((p) => {
                  const cur = matchingAnswersFor(p[question.id]?.openText)
                  return { ...p, [question.id]: { ...p[question.id], openText: JSON.stringify({ ...cur, [li]: Number(e.target.value) }) } }
                })}
                style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14 }}
              >
                <option value="">— select —</option>
                {question.matchingPairs!.map((p, ri) => <option key={ri} value={ri}>{p.right}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* OPEN */}
      {question.type === 'OPEN' && (
        <textarea rows={4} value={openText ?? ''} placeholder="Write your answer…"
          onChange={(e) => onSetAnswers((p) => ({ ...p, [question.id]: { ...p[question.id], openText: e.target.value } }))}
          style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', marginBottom: 16, resize: 'vertical' }}
        />
      )}

      {submitError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
          <AlertCircle size={14} /> {submitError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <button onClick={() => onSetIndex(Math.max(0, questionIndex - 1))} disabled={questionIndex === 0} className="btn btn-outline-dim btn-sm">
          <ChevronLeft size={14} /> Previous
        </button>
        {isLast ? (
          <button onClick={onSubmit} className="btn btn-gold btn-sm">
            <Send size={14} /> Submit
          </button>
        ) : (
          <button onClick={() => onSetIndex(questionIndex + 1)} className="btn btn-gold btn-sm">
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
