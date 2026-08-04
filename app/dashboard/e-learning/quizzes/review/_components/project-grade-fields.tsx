'use client'

import { projectSubmissionFormatLabels } from '@/app/member/_shared/assessment-data'
import type { TakeableAssessment } from '@/app/member/_shared/assessment-data'
import { PROJECT_SUBMISSION_KEY } from '@/app/member/_shared/use-assessment-attempts'
import type { AttemptRecord } from './use-attempts-admin'

interface ProjectGradeFieldsProps {
  assessment: TakeableAssessment
  attempt: AttemptRecord
  score: number
  onScoreChange: (value: number) => void
}

/**
 * Grading fields for a PROJECT attempt: shows the brief, the member's
 * submitted text/link, and a single score bounded by the assessment's
 * `projectMarks` — no per-question breakdown, since a project has no
 * questions at all. Rendered by `GradeAttemptModal` instead of its
 * per-OPEN-question loop when `assessment.kind === 'PROJECT'`.
 */
export function ProjectGradeFields({ assessment, attempt, score, onScoreChange }: ProjectGradeFieldsProps) {
  const submission = attempt.openAnswers?.[PROJECT_SUBMISSION_KEY]
  const maxMarks = assessment.projectMarks ?? attempt.totalMarks

  return (
    <div className="bg-w-100 border border-w-300 rounded p-3 space-y-2">
      <p className="text-xs text-w-600 italic">{assessment.brief}</p>
      <p className="text-xs font-semibold text-w-950">
        Submission format: {assessment.submissionFormat ? projectSubmissionFormatLabels[assessment.submissionFormat] : '—'}
      </p>
      <div className="bg-white border border-w-300 rounded p-2">
        {submission && assessment.submissionFormat === 'LINK' ? (
          <a href={submission} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline break-all">{submission}</a>
        ) : (
          <p className="text-xs text-w-700 whitespace-pre-wrap">{submission || <span className="italic text-w-500">No submission recorded.</span>}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="project-score" className="text-xs font-lato font-semibold text-w-700">Score</label>
        <input
          id="project-score"
          type="number"
          min={0}
          max={maxMarks}
          value={score}
          onChange={(e) => onScoreChange(Math.max(0, Math.min(Number(e.target.value), maxMarks)))}
          aria-label={`Score out of ${maxMarks}`}
          className="w-20 px-2 py-1 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
        />
        <span className="text-xs text-w-600">/ {maxMarks}</span>
      </div>
    </div>
  )
}
