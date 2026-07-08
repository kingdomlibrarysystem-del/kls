/** Assessment kind, per kls-product-spec Task 6.4/6.5 — only exams are timed. */
export type AssessmentKind = 'QUIZ' | 'EXAM'

/**
 * Question type, per kls-product-spec Task 6.4 / Prisma `Question.type`.
 * SINGLE_SELECT and MULTI_SELECT both auto-grade (single by index match,
 * multi by exact set match); OPEN needs manual review. SINGLE_SELECT was
 * named MCQ prior to differentiated-assessment-types Phase A — renamed to
 * sit honestly alongside MULTI_SELECT rather than implying "the" MCQ type.
 */
export type QuestionType = 'SINGLE_SELECT' | 'MULTI_SELECT' | 'OPEN'

export interface Question {
  id: string
  text: string
  type: QuestionType
  /** Optional longer prompt/context block rendered above the question text — the scenario-based case. Usable by any type. */
  context?: string
  options?: string[]
  /** SINGLE_SELECT only. */
  correctOptionIndex?: number
  /** MULTI_SELECT only — scored as exact set match, no partial credit. */
  correctOptionIndices?: number[]
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
      { id: 'q1', text: 'What does the Foundation pillar establish?', type: 'SINGLE_SELECT', options: ['The end of all things', 'The origin of all things', 'Church expansion', 'Prophetic warnings'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Which section is described as the "Voice of the Kingdom"?', type: 'SINGLE_SELECT', options: ['Wisdom', 'Prophetic', 'Acts', 'Epistles'], correctOptionIndex: 1, marks: 10 },
    ],
  },
  '2': {
    id: '2',
    title: 'Kingdom Foundations — Midterm',
    kind: 'EXAM',
    courseId: '1',
    durationSeconds: 90,
    questions: [
      { id: 'q1', text: 'Which book range does the Foundation pillar cover?', type: 'SINGLE_SELECT', options: ['Genesis – Deuteronomy', 'Joshua – Esther', 'Job – Song of Songs', 'Matthew – John'], correctOptionIndex: 0, marks: 10 },
      { id: 'q2', text: 'What is the theme of the History pillar?', type: 'SINGLE_SELECT', options: ['Warnings and Hope', 'Leadership and Restoration', 'Life of Christ', 'Kingdom Living'], correctOptionIndex: 1, marks: 10 },
      {
        id: 'q3',
        text: 'Which of these pillars are covered by the Foundation-to-History exam scope?',
        type: 'MULTI_SELECT',
        context: 'The midterm spans the first two KCS pillars only — select every pillar this exam actually covers, not the full eight-pillar system.',
        options: ['Foundation', 'History', 'Wisdom', 'Prophetic'],
        correctOptionIndices: [0, 1],
        marks: 10,
      },
      {
        id: 'q4',
        text: 'In one paragraph, describe how covenant shapes Kingdom identity.',
        type: 'OPEN',
        context: 'Scenario: a new member asks why the Kingdom Classification System begins with Genesis rather than the Gospels. Use covenant to explain the ordering choice.',
        marks: 20,
      },
    ],
  },
  '3': {
    id: '3',
    title: 'Understanding Divine Purpose — Quiz 1',
    kind: 'QUIZ',
    courseId: '2',
    questions: [
      { id: 'q1', text: 'What is the difference between purpose and calling?', type: 'SINGLE_SELECT', options: ['There is no difference', 'Purpose is why, calling is what', 'Calling is why, purpose is what', 'Both are the same as talent'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Purpose is best discovered through:', type: 'SINGLE_SELECT', options: ['Isolation', 'Reflection and community', 'Comparison to others', 'Chance'], correctOptionIndex: 1, marks: 10 },
    ],
  },
  '4': {
    id: '4',
    title: 'The Art of Worship — Quiz 1',
    kind: 'QUIZ',
    courseId: '4',
    questions: [
      { id: 'q1', text: 'Worship is best described as:', type: 'SINGLE_SELECT', options: ['A single weekly act', 'A continuous lifestyle', 'Only musical expression', 'A private emotion only'], correctOptionIndex: 1, marks: 10 },
      { id: 'q2', text: 'Corporate worship primarily builds:', type: 'SINGLE_SELECT', options: ['Individual talent', 'Shared identity and community', 'Musical skill only', 'Competition'], correctOptionIndex: 1, marks: 10 },
    ],
  },
}
