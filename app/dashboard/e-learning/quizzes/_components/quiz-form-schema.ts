import { z } from 'zod'

const optionSchema = z.string().min(1, 'Option text is required')

export const questionSchema = z.object({
  text: z.string().min(3, 'Question text must be at least 3 characters'),
  options: z.array(optionSchema).min(2, 'At least 2 options are required'),
  correctOptionIndex: z.number().min(0, 'Select the correct answer'),
  marks: z.number().min(1, 'Marks must be at least 1'),
})

export const quizFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  courseId: z.string().min(1, 'Select a course'),
  kind: z.enum(['QUIZ', 'EXAM']),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
})

export type QuizFormData = z.infer<typeof quizFormSchema>

export const emptyQuestion = { text: '', options: ['', ''], correctOptionIndex: 0, marks: 10 }
