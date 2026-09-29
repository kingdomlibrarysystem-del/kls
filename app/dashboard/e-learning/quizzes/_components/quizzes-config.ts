export type { TakeableAssessment, AssessmentKind, Question, QuestionType, ProjectSubmissionFormat } from '@/app/member/_shared/assessment-data'
import type { AssessmentKind } from '@/app/member/_shared/assessment-data'

export const kindConfig: Record<AssessmentKind, { label: string; cls: string }> = {
  QUIZ: { label: 'Quiz', cls: 'bg-w-100 text-w-700 border-w-300' },
  EXAM: { label: 'Exam', cls: 'bg-blue-50 dark:bg-info/10 text-blue-800 border-blue-200 dark:border-info/30' },
  PROJECT: { label: 'Project', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
}
