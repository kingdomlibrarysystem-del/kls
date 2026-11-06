'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardList, Clock, Eye, EyeOff, Send, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recordAssessmentAttempt, type AssessmentAttempt, type SubmittedAnswer } from '../../../../../_shared/use-assessment-attempts'
import type { Question, TakeableAssessment } from '../../../../../_shared/assessment-data'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const fixedOptions = (q: Question): string[] | null => (q.type === 'YES_NO' ? ['Yes', 'No'] : q.type === 'TRUE_FALSE' ? ['True', 'False'] : null)
const optionsOf = (q: Question): string[] => q.options?.length ? q.options : fixedOptions(q) ?? []

function matchingOf(openText?: string): Record<number, number> {
  if (!openText) return {}
  try { return JSON.parse(openText) as Record<number, number> } catch { return {} }
}

/** True when the member has given an answer of the right kind for this question. */
function isAnswered(q: Question, a: SubmittedAnswer | undefined): boolean {
  if (!a) return false
  switch (q.type) {
    case 'MULTI_SELECT': return (a.optionIndices?.length ?? 0) > 0
    case 'MATCHING': { const m = matchingOf(a.openText); return (q.matchingPairs ?? []).every((_, i) => typeof m[i] === 'number' && !Number.isNaN(m[i])) }
    case 'OPEN': return !!a.openText?.trim()
    default: return a.optionIndex !== undefined
  }
}

/** Same rules the server grades with (app/api/assessment-attempts); null for OPEN — a teacher grades those. */
function isCorrect(q: Question, a: SubmittedAnswer | undefined): boolean | null {
  switch (q.type) {
    case 'OPEN': return null
    case 'MULTI_SELECT': {
      const given = new Set(a?.optionIndices ?? []); const right = new Set(q.correctOptionIndices ?? [])
      return given.size === right.size && [...given].every((v) => right.has(v))
    }
    case 'MATCHING': { const m = matchingOf(a?.openText); return (q.matchingPairs ?? []).every((_, i) => m[i] === i) }
    default: return a?.optionIndex !== undefined && a.optionIndex === q.correctOptionIndex
  }
}

function describeAnswer(q: Question, a: SubmittedAnswer | undefined, none: string): string {
  const opts = optionsOf(q)
  switch (q.type) {
    case 'MULTI_SELECT': return a?.optionIndices?.length ? a.optionIndices.map((i) => opts[i]).join(', ') : none
    case 'MATCHING': { const m = matchingOf(a?.openText); return (q.matchingPairs ?? []).map((p, i) => `${p.left} → ${q.matchingPairs?.[m[i]]?.right ?? '—'}`).join('; ') || none }
    case 'OPEN': return a?.openText?.trim() || none
    default: return a?.optionIndex !== undefined ? opts[a.optionIndex] ?? none : none
  }
}

function describeCorrect(q: Question): string {
  const opts = optionsOf(q)
  switch (q.type) {
    case 'MULTI_SELECT': return (q.correctOptionIndices ?? []).map((i) => opts[i]).join(', ')
    case 'MATCHING': return (q.matchingPairs ?? []).map((p) => `${p.left} → ${p.right}`).join('; ')
    default: return q.correctOptionIndex !== undefined ? opts[q.correctOptionIndex] ?? '' : ''
  }
}

interface LessonQuizInlineProps {
  assessment: TakeableAssessment
  /** Controlled by the lesson page so "Take the quiz" in the complete dialog can open it. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The member's earlier attempt — a quiz is done once, then it shows the marks. */
  attempt?: AssessmentAttempt
  onSubmitted: () => void
}

/**
 * The lesson's optional quiz / test. Every question must be answered before
 * moving on or submitting (with a clear message). After grading, if some
 * answers are wrong the member is asked whether to see the correct answers.
 * One try only: once done it shows the marks (the server refuses a second try).
 */
export function LessonQuizInline({ assessment, open, onOpenChange, attempt, onSubmitted }: LessonQuizInlineProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, SubmittedAnswer>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ earned: number; total: number; pending?: boolean } | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const questions = assessment.questions
  const q = questions[index]
  const total = questions.length
  const kindLabel = assessment.kind === 'TEST' ? 'Lesson Test' : 'Lesson Quiz'
  const done = !!attempt || !!result
  const marks = result ?? (attempt ? { earned: attempt.score, total: attempt.totalMarks } : null)

  const setAnswer = (patch: SubmittedAnswer) => { setError(''); setAnswers((p) => ({ ...p, [q.id]: { ...p[q.id], ...patch } })) }

  const next = () => {
    if (!isAnswered(q, answers[q.id])) { setError(q.type === 'MATCHING' ? t('m_quiz.match_all') : t('m_quiz.answer_first')); return }
    setError(''); setIndex((i) => Math.min(total - 1, i + 1))
  }

  const submit = async () => {
    const missing = questions.findIndex((x) => !isAnswered(x, answers[x.id]))
    if (missing >= 0) { setIndex(missing); setError(t('m_quiz.answer_all').replace('{n}', String(missing + 1))); return }
    setBusy(true); setError('')
    try {
      if (!user) throw new Error('You must be signed in')
      const attempt = await recordAssessmentAttempt(user.id, assessment.id, answers)
      setResult({ earned: attempt.score ?? 0, total: attempt.totalMarks ?? questions.reduce((s, x) => s + x.marks, 0), pending: attempt.reviewStatus === 'PENDING_REVIEW' })
      setReviewing(false)
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit')
    } finally { setBusy(false) }
  }

  const wrongCount = result ? questions.filter((x) => isCorrect(x, answers[x.id]) === false).length : 0

  return (
    <div id="lesson-quiz" className="mt-6 scroll-mt-24 overflow-hidden rounded-xl border border-primary/50">
      <button type="button" onClick={() => onOpenChange(!open)} aria-expanded={open}
        className="flex w-full items-center gap-3 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10">
        <ClipboardList className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">{kindLabel}</span>
          <span className="block font-semibold text-foreground">{assessment.title}</span>
          <span className="text-xs text-muted-foreground">{done && marks ? `${t('m_quiz.done')} · ${t('m_quiz.your_marks')}: ${marks.earned} / ${marks.total}` : `${total} question${total !== 1 ? 's' : ''} · optional · ${t('m_quiz.one_try')}`}</span>
        </span>
        {done && <CheckCircle2 className="size-5 text-success" aria-hidden />}
        {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-primary/30 p-4">
          {attempt && !result ? (
            <div className="text-center">
              {attempt.reviewStatus === 'PENDING_REVIEW' ? <Clock className="mx-auto size-10 text-primary" aria-hidden /> : <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />}
              <p className="mt-2 text-sm font-semibold text-foreground">{t('m_quiz.already_done')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('m_quiz.your_marks')}</p>
              <p className="font-cinzel text-2xl font-bold text-foreground">{attempt.score} / {attempt.totalMarks}</p>
              {attempt.reviewStatus === 'PENDING_REVIEW' && <p className="mt-1 text-xs text-muted-foreground">{t('m_quiz.waiting_review')}</p>}
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="text-center">
                {wrongCount === 0 ? <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden /> : <AlertCircle className="mx-auto size-10 text-primary" aria-hidden />}
                <p className="mt-2 text-sm text-muted-foreground">{t('m_quiz.score')}</p>
                <p className="font-cinzel text-2xl font-bold text-foreground">{result.earned} / {result.total}</p>
                <p className="mt-1 text-sm text-muted-foreground">{wrongCount === 0 ? t('m_quiz.perfect') : t('m_quiz.some_wrong')}</p>
              </div>

              {wrongCount > 0 && !reviewing && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-center">
                  <p className="text-sm font-medium text-foreground">{t('m_quiz.show_answers_q')}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={() => setReviewing(true)}><Eye /> {t('m_quiz.show_answers')}</Button>
                  </div>
                </div>
              )}

              {reviewing && (
                <ol className="space-y-2">
                  {questions.map((x, i) => {
                    const ok = isCorrect(x, answers[x.id])
                    return (
                      <li key={x.id} className={`rounded-lg border p-3 text-sm ${ok === false ? 'border-destructive/40 bg-destructive/5' : ok ? 'border-success/30 bg-success/5' : 'border-border'}`}>
                        <p className="flex items-start gap-2 font-medium text-foreground">
                          {ok === false ? <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : <ClipboardList className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                          <span>{i + 1}. {x.text}</span>
                        </p>
                        <p className="mt-1 pl-6 text-muted-foreground"><span className="font-semibold">{t('m_quiz.your_answer')}:</span> {describeAnswer(x, answers[x.id], t('m_quiz.no_answer'))}</p>
                        {ok === false && <p className="pl-6 text-foreground"><span className="font-semibold">{t('m_quiz.correct_answer')}:</span> {describeCorrect(x)}</p>}
                        {ok === null && <p className="pl-6 text-xs text-muted-foreground">{t('m_quiz.reviewed_later')}</p>}
                      </li>
                    )
                  })}
                </ol>
              )}

              {reviewing && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setReviewing(false)}><EyeOff /> {t('m_quiz.hide_answers')}</Button>
                </div>
              )}
              {result.pending && <p className="text-center text-xs text-muted-foreground">{t('m_quiz.waiting_review')}</p>}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Question {index + 1} of {total} · {q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
              {q.context && <p className="mb-3 rounded-md bg-muted/50 p-2.5 text-sm leading-relaxed text-muted-foreground">{q.context}</p>}
              <p className="mb-3 font-semibold text-foreground">{q.text}</p>

              {(q.type === 'SINGLE_SELECT' || fixedOptions(q)) && (
                <div role="radiogroup" className="mb-4 flex flex-col gap-1.5">
                  {optionsOf(q).map((opt, i) => {
                    const sel = answers[q.id]?.optionIndex === i
                    return (
                      <button key={`${opt}-${i}`} type="button" role="radio" aria-checked={sel} onClick={() => setAnswer({ optionIndex: i })}
                        className={`flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${sel ? 'bg-primary/15' : 'hover:bg-muted/60'}`}>
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${sel ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'}`}>{LETTERS[i]}</span>
                        <span className={`pt-0.5 text-sm ${sel ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{opt}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'MULTI_SELECT' && (
                <div role="group" className="mb-4 flex flex-col gap-1.5">
                  {optionsOf(q).map((opt, i) => {
                    const cur = answers[q.id]?.optionIndices ?? []
                    const sel = cur.includes(i)
                    return (
                      <button key={`${opt}-${i}`} type="button" role="checkbox" aria-checked={sel} onClick={() => setAnswer({ optionIndices: sel ? cur.filter((x) => x !== i) : [...cur, i] })}
                        className={`flex w-full items-start gap-2.5 rounded-md px-3 py-2 text-left transition-colors ${sel ? 'bg-primary/15' : 'hover:bg-muted/60'}`}>
                        <span className={`flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-bold ${sel ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'}`}>{LETTERS[i]}</span>
                        <span className={`pt-0.5 text-sm ${sel ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{opt}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'MATCHING' && q.matchingPairs && (
                <div className="mb-4 flex flex-col gap-2">
                  {q.matchingPairs.map((pair, li) => (
                    <div key={li} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <span className="flex-1 rounded-md bg-muted/50 px-2.5 py-2 text-sm text-foreground">{pair.left}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <select aria-label={`Match for "${pair.left}"`} value={matchingOf(answers[q.id]?.openText)[li] ?? ''}
                        onChange={(e) => setAnswer({ openText: JSON.stringify({ ...matchingOf(answers[q.id]?.openText), [li]: e.target.value === '' ? undefined : Number(e.target.value) }) })}
                        className="h-9 flex-1 rounded-md border border-input bg-card px-2 text-sm text-foreground">
                        <option value="">— select —</option>
                        {q.matchingPairs!.map((p, ri) => <option key={ri} value={ri}>{p.right}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'OPEN' && (
                <textarea rows={4} value={answers[q.id]?.openText ?? ''} placeholder="Write your answer…" onChange={(e) => setAnswer({ openText: e.target.value })}
                  className="mb-4 w-full resize-y rounded-md border border-input bg-card p-2.5 text-sm text-foreground outline-none focus-visible:border-ring" />
              )}

              {error && <p role="alert" className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" /> {error}</p>}

              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={() => { setError(''); setIndex((i) => Math.max(0, i - 1)) }} disabled={index === 0}><ChevronLeft /> Previous</Button>
                {index === total - 1
                  ? <Button size="sm" onClick={submit} disabled={busy}><Send /> {busy ? 'Sending…' : 'Submit'}</Button>
                  : <Button size="sm" onClick={next}>Next <ChevronRight /></Button>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
