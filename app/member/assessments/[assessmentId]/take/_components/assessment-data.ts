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
  /** Countdown duration in seconds — only meaningful when `kind === 'EXAM'`. */
  durationSeconds?: number
  questions: Question[]
}

/** Mock takeable assessments keyed by the numeric IDs used in member/assessments/page.tsx. */
export const takeableAssessments: Record<string, TakeableAssessment> = {
  '2': {
    id: '2',
    title: 'Kingdom Foundations — Midterm',
    kind: 'EXAM',
    durationSeconds: 90,
    questions: [
      { id: 'q1', text: 'Which book range does the Foundation pillar cover?', type: 'MCQ', options: ['Genesis – Deuteronomy', 'Joshua – Esther', 'Job – Song of Songs', 'Matthew – John'], correctOptionIndex: 0, marks: 10 },
      { id: 'q2', text: 'What is the theme of the History pillar?', type: 'MCQ', options: ['Warnings and Hope', 'Leadership and Restoration', 'Life of Christ', 'Kingdom Living'], correctOptionIndex: 1, marks: 10 },
      { id: 'q3', text: 'In one paragraph, describe how covenant shapes Kingdom identity.', type: 'OPEN', marks: 20 },
    ],
  },
  '1': {
    id: '1',
    title: 'Kingdom Foundations — Quiz 1',
    kind: 'QUIZ',
    questions: [
      { id: 'q1', text: 'What does the Foundation pillar establish?', type: 'MCQ', options: ['The end of all things', 'The origin of all things', 'Church expansion', 'Prophetic warnings'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Which section is described as the "Voice of the Kingdom"?', type: 'MCQ', options: ['Wisdom', 'Prophetic', 'Acts', 'Epistles'], correctOptionIndex: 1, marks: 10 },
    ],
  },
}
