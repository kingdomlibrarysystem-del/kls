export type { TakeableAssessment, AssessmentKind, Question, QuestionType } from '@/app/member/_shared/assessment-data'
import type { AssessmentKind } from '@/app/member/_shared/assessment-data'

export const kindConfig: Record<AssessmentKind, { label: string; cls: string }> = {
  QUIZ: { label: 'Quiz', cls: 'bg-w-100 text-w-700 border-w-300' },
  EXAM: { label: 'Exam', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
}
