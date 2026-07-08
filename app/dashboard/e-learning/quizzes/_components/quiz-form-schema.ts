import { z } from 'zod'

const optionSchema = z.string().min(1, 'Option text is required')

export const questionTypeSchema = z.enum(['SINGLE_SELECT', 'MULTI_SELECT', 'OPEN'])

/**
 * Base shape is permissive (options/correctOptionIndex/correctOptionIndices
 * all optional) because their requirement depends on `type` — enforced below
 * via `.superRefine` rather than making the base schema lie about a shape
 * that's only valid for two of the three types.
 */
export const questionSchema = z
  .object({
    type: questionTypeSchema,
    text: z.string().min(3, 'Question text must be at least 3 characters'),
    context: z.string().optional(),
    options: z.array(optionSchema).optional(),
    correctOptionIndex: z.number().optional(),
    correctOptionIndices: z.array(z.number()).optional(),
    marks: z.number().min(1, 'Marks must be at least 1'),
  })
  .superRefine((question, ctx) => {
    if (question.type === 'SINGLE_SELECT') {
      if (!question.options || question.options.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'At least 2 options are required' })
      }
      if (question.correctOptionIndex === undefined) {
        ctx.addIssue({ code: 'custom', path: ['correctOptionIndex'], message: 'Select the correct answer' })
      }
    }
    if (question.type === 'MULTI_SELECT') {
      if (!question.options || question.options.length < 2) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'At least 2 options are required' })
      }
      if (!question.correctOptionIndices || question.correctOptionIndices.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['correctOptionIndices'], message: 'Select at least one correct answer' })
      }
    }
  })

export const quizFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  courseId: z.string().min(1, 'Select a course'),
  kind: z.enum(['QUIZ', 'EXAM']),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
})

export type QuizFormData = z.infer<typeof quizFormSchema>

export const emptyQuestion = {
  type: 'SINGLE_SELECT' as const,
  text: '',
  context: '',
  options: ['', ''],
  correctOptionIndex: 0,
  correctOptionIndices: [],
  marks: 10,
}
