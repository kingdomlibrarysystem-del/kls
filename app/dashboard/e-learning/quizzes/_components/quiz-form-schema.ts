import { z } from 'zod'

export const questionTypeSchema = z.enum(['SINGLE_SELECT', 'MULTI_SELECT', 'OPEN', 'YES_NO', 'TRUE_FALSE', 'MATCHING'])

/**
 * Base shape is deliberately permissive: every question carries placeholders
 * for the sub-fields of every type (an author can switch type without losing
 * data), so type-specific rules live in `.superRefine` below. Validating the
 * placeholders here would fail a valid SINGLE_SELECT because its unused
 * `matchingPairs` are still blank (and vice versa).
 */
export const questionSchema = z
  .object({
    type: questionTypeSchema,
    text: z.string().min(3, 'Question text must be at least 3 characters'),
    context: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctOptionIndex: z.number().optional(),
    correctOptionIndices: z.array(z.number()).optional(),
    matchingPairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
    marks: z.number().min(1, 'Marks must be at least 1'),
  })
  .superRefine((question, ctx) => {
    if (question.type === 'SINGLE_SELECT' || question.type === 'MULTI_SELECT') {
      const options = question.options ?? []
      if (options.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'At least 2 options are required' })
      } else {
        const emptyIndex = options.findIndex((option) => option.trim().length === 0)
        if (emptyIndex !== -1) {
          ctx.addIssue({ code: 'custom', path: ['options', emptyIndex], message: 'Option text is required' })
        }
      }
      if (question.type === 'SINGLE_SELECT' && question.correctOptionIndex === undefined) {
        ctx.addIssue({ code: 'custom', path: ['correctOptionIndex'], message: 'Select the correct answer' })
      }
      if (question.type === 'MULTI_SELECT' && (!question.correctOptionIndices || question.correctOptionIndices.length === 0)) {
        ctx.addIssue({ code: 'custom', path: ['correctOptionIndices'], message: 'Select at least one correct answer' })
      }
    }
    if (question.type === 'YES_NO' || question.type === 'TRUE_FALSE') {
      if (question.correctOptionIndex === undefined) {
        ctx.addIssue({ code: 'custom', path: ['correctOptionIndex'], message: 'Select the correct answer' })
      }
    }
    if (question.type === 'MATCHING') {
      const pairs = question.matchingPairs ?? []
      if (pairs.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['matchingPairs'], message: 'At least 2 matching pairs are required' })
      } else {
        pairs.forEach((pair, index) => {
          if (pair.left.trim().length === 0) {
            ctx.addIssue({ code: 'custom', path: ['matchingPairs', index, 'left'], message: 'Left item is required' })
          }
          if (pair.right.trim().length === 0) {
            ctx.addIssue({ code: 'custom', path: ['matchingPairs', index, 'right'], message: 'Right item is required' })
          }
        })
      }
    }
  })

export const projectSubmissionFormatSchema = z.enum(['TEXT', 'LINK', 'FILE_REF'])

/**
 * `questions` stays a plain array (not `.min(1)` at the base level) because
 * PROJECT assessments intentionally have zero questions — the `min(1)`
 * requirement is enforced in `.superRefine` below, scoped to QUIZ/EXAM
 * only, alongside PROJECT's own document/`submissionFormat` requirement.
 */
export const quizFormSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    courseId: z.string().min(1, 'Select a course'),
    kind: z.enum(['TEST', 'QUIZ', 'EXAM', 'PROJECT']),
    /** Lesson ID — a lesson quiz or test shows on this lesson only. */
    lessonId: z.string().optional(),
    /** Time limit in minutes (quiz/test/exam; empty = no limit, an exam needs one). NaN = left empty. */
    durationMinutes: z.number().min(1, 'Time limit must be at least 1 minute').optional().or(z.nan()),
    /** Project only: days members have to complete it (empty = no limit). */
    durationDays: z.number().min(1, 'Give at least 1 day').optional().or(z.nan()),
    /**
     * Checked in superRefine, and only for a quiz/test/exam: a PROJECT hides the
     * question builder, so its (blank) starter question must never block saving.
     */
    questions: z.array(z.custom<z.infer<typeof questionSchema>>()),
    /** Older projects only (read-only now) — new projects are a document. */
    brief: z.string().optional(),
    /** PROJECT: the uploaded project document (PDF, Word, PowerPoint…). */
    briefFileUrl: z.string().optional(),
    briefFileName: z.string().optional(),
    submissionFormat: projectSubmissionFormatSchema.optional(),
    projectMarks: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'EXAM' && !(data.durationMinutes && data.durationMinutes >= 1)) {
      ctx.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'Set the exam time limit (minutes)' })
    }
    if ((data.kind === 'TEST' || data.kind === 'QUIZ') && !data.lessonId) {
      ctx.addIssue({ code: 'custom', path: ['lessonId'], message: 'Select the lesson this belongs to' })
    }
    if (data.kind === 'PROJECT') {
      // A project is a document; an older project that only has a typed brief can still be saved.
      if (!data.briefFileUrl && !data.brief?.trim()) {
        ctx.addIssue({ code: 'custom', path: ['briefFileUrl'], message: 'Upload the project document (PDF, Word, PowerPoint…)' })
      }
      if (!data.submissionFormat) {
        ctx.addIssue({ code: 'custom', path: ['submissionFormat'], message: 'Select a submission format' })
      }
      if (!data.projectMarks || data.projectMarks < 1) {
        ctx.addIssue({ code: 'custom', path: ['projectMarks'], message: 'Total marks must be at least 1' })
      }
    } else if (data.questions.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['questions'], message: 'At least 1 question is required' })
    } else {
      data.questions.forEach((q, i) => {
        const checked = questionSchema.safeParse(q)
        if (!checked.success) {
          for (const issue of checked.error.issues) ctx.addIssue({ code: 'custom', path: ['questions', i, ...issue.path], message: issue.message })
        }
      })
    }
  })

export type QuizFormData = z.infer<typeof quizFormSchema>

/** The first validation message in react-hook-form's nested errors — shown above the buttons so a refusal is never silent. */
export function firstFormError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== 'object') return undefined
  const e = errors as { message?: unknown }
  if (typeof e.message === 'string' && e.message) return e.message
  for (const value of Object.values(errors as Record<string, unknown>)) {
    const found = value && typeof value === 'object' ? firstFormError(value) : undefined
    if (found) return found
  }
  return undefined
}

/**
 * Builds a fresh empty question. A function (rather than one shared object)
 * is important once the form supports adding several questions at once —
 * reusing the same object reference for multiple field-array rows makes
 * react-hook-form treat their nested arrays as the same input.
 */
export function createEmptyQuestion() {
  return {
    type: 'SINGLE_SELECT' as const,
    text: '',
    context: '',
    options: ['', ''],
    correctOptionIndex: 0,
    correctOptionIndices: [] as number[],
    matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }],
    marks: 10,
  }
}

export const emptyQuestion = createEmptyQuestion()
