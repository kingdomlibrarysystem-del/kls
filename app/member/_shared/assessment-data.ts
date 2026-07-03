/** Assessment kind, per kls-product-spec Task 6.4/6.5 — only exams are timed. */
export type AssessmentKind = 'QUIZ' | 'EXAM'

/** Question type, per kls-product-spec Task 6.4 / Prisma `Question.type`. MCQ auto-grades; OPEN needs manual review. */
export type QuestionType = 'MCQ' | 'OPEN'

export interface Question {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  correctOptionIndex?: number
  marks: number
}

export interface TakeableAssessment {
  id: string
  title: string
  kind: AssessmentKind
  /** Course ID from course-catalog-data.ts — links a pass back to that course's enrollment. */
  courseId: string
  /** Countdown duration in seconds — only meaningful when `kind === 'EXAM'`. */
  durationSeconds?: number
  questions: Question[]
}

/**
 * Canonical assessments keyed by the IDs used across the member take-flow.
 * Lives in `_shared` (not under the member take-assessment route) because
 * both the member take-assessment flow and the admin Quizzes & Exams
 * management page (/dashboard/e-learning/quizzes) read and, on the admin
 * side, write this same data.
 */
export const initialTakeableAssessments: Record<string, TakeableAssessment> = {
  '1': {
    id: '1',
    title: 'Kingdom Foundations — Quiz 1',
    kind: 'QUIZ',
    courseId: '1',
    questions: [
      { id: 'q1', text: 'What does the Foundation pillar establish?', type: 'MCQ', options: ['The end of all things', 'The origin of all things', 'Church expansion', 'Prophetic warnings'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Which section is described as the "Voice of the Kingdom"?', type: 'MCQ', options: ['Wisdom', 'Prophetic', 'Acts', 'Epistles'], correctOptionIndex: 1, marks: 10 },
    ],
  },
  '2': {
    id: '2',
    title: 'Kingdom Foundations — Midterm',
    kind: 'EXAM',
    courseId: '1',
    durationSeconds: 90,
    questions: [
      { id: 'q1', text: 'Which book range does the Foundation pillar cover?', type: 'MCQ', options: ['Genesis – Deuteronomy', 'Joshua – Esther', 'Job – Song of Songs', 'Matthew – John'], correctOptionIndex: 0, marks: 10 },
      { id: 'q2', text: 'What is the theme of the History pillar?', type: 'MCQ', options: ['Warnings and Hope', 'Leadership and Restoration', 'Life of Christ', 'Kingdom Living'], correctOptionIndex: 1, marks: 10 },
      { id: 'q3', text: 'In one paragraph, describe how covenant shapes Kingdom identity.', type: 'OPEN', marks: 20 },
    ],
  },
  '3': {
    id: '3',
    title: 'Understanding Divine Purpose — Quiz 1',
    kind: 'QUIZ',
    courseId: '2',
    questions: [
      { id: 'q1', text: 'What is the difference between purpose and calling?', type: 'MCQ', options: ['There is no difference', 'Purpose is why, calling is what', 'Calling is why, purpose is what', 'Both are the same as talent'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Purpose is best discovered through:', type: 'MCQ', options: ['Isolation', 'Reflection and community', 'Comparison to others', 'Chance'], correctOptionIndex: 1, marks: 10 },
    ],
  },
  '4': {
    id: '4',
    title: 'The Art of Worship — Quiz 1',
    kind: 'QUIZ',
    courseId: '4',
    questions: [
      { id: 'q1', text: 'Worship is best described as:', type: 'MCQ', options: ['A single weekly act', 'A continuous lifestyle', 'Only musical expression', 'A private emotion only'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Corporate worship primarily builds:', type: 'MCQ', options: ['Individual talent', 'Shared identity and community', 'Musical skill only', 'Competition'], correctOptionIndex: 1, marks: 10 },
    ],
  },
}
