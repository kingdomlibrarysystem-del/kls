import Link from 'next/link'
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import type { TakeableAssessment } from '../../../../_shared/assessment-data'
import type { AssessmentAttempt } from '../../../../_shared/use-assessment-attempts'

interface ResultsScreenProps {
  assessment: TakeableAssessment
  attempt: AssessmentAttempt
  autoSubmitted: boolean
}

/**
 * Results screen shown after submission. While `attempt.reviewStatus` is
 * PENDING_REVIEW, this honestly shows a partial/provisional score and a
 * pending-review state instead of a final pass/fail verdict — the OPEN
 * portion of the score isn't real until a manager grades it via the admin
 * review queue, at which point this same screen (revisited from Assessment
 * History) will show the finalized GRADED score.
 */
export function ResultsScreen({ assessment, attempt, autoSubmitted }: ResultsScreenProps) {
  const { score, totalMarks, reviewStatus } = attempt
  const isPending = reviewStatus === 'PENDING_REVIEW'
  const passed = !isPending && totalMarks > 0 && score / totalMarks >= 0.5

  return (
    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
      {autoSubmitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 16 }}>
          <AlertTriangle size={15} /> Time expired — your answers were submitted automatically.
        </div>
      )}

      {isPending ? (
        <Clock size={40} color="var(--gold)" />
      ) : passed ? (
        <CheckCircle2 size={40} color="var(--green-light)" />
      ) : (
        <XCircle size={40} color="var(--red-light)" />
      )}

      <h1 className="cinzel" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
        {assessment.title}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
        {isPending
          ? 'Submitted — awaiting manager review.'
          : passed ? 'Well done — you passed.' : 'You did not reach the passing threshold this time.'}
      </p>

      <div style={{ fontSize: 36, fontWeight: 700, color: isPending ? 'var(--gold)' : passed ? 'var(--green-light)' : 'var(--red-light)' }}>
        {score} / {totalMarks}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
        {isPending
          ? assessment.kind === 'PROJECT'
            ? 'Your score will appear once a manager reviews this submission.'
            : 'This score covers auto-graded questions only — it will update once your open-ended answers are reviewed.'
          : 'Final score, including any manager-reviewed portion.'}
      </p>

      <Link href="/member/assessments" className="btn btn-gold btn-sm" style={{ display: 'inline-flex' }}>
        Back to Assessments
      </Link>
    </div>
  )
}
