import Link from 'next/link'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { TakeableAssessment } from '../../../../_shared/assessment-data'

interface ResultsScreenProps {
  assessment: TakeableAssessment
  score: number
  totalMarks: number
  autoSubmitted: boolean
}

/** Results screen shown after submission: score against total, plus a note if the timer auto-submitted. */
export function ResultsScreen({ assessment, score, totalMarks, autoSubmitted }: ResultsScreenProps) {
  const passed = totalMarks > 0 && score / totalMarks >= 0.5

  return (
    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
      {autoSubmitted && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 16 }}>
          <AlertTriangle size={13} /> Time expired — your answers were submitted automatically.
        </div>
      )}

      {passed ? <CheckCircle2 size={40} color="var(--green-light)" /> : <XCircle size={40} color="var(--red-light)" />}

      <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '12px 0 4px' }}>
        {assessment.title}
      </h1>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
        {passed ? 'Well done — you passed.' : 'You did not reach the passing threshold this time.'}
      </p>

      <div style={{ fontSize: 32, fontWeight: 700, color: passed ? 'var(--green-light)' : 'var(--red-light)' }}>
        {score} / {totalMarks}
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 20 }}>
        Open-ended questions are marked as pending until a Manager reviews them.
      </p>

      <Link href="/member/assessments" className="btn btn-gold btn-sm" style={{ display: 'inline-flex' }}>
        Back to Assessments
      </Link>
    </div>
  )
}
