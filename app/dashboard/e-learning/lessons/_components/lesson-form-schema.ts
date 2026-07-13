import { z } from 'zod'

export const lessonSchema = z.object({
  courseId: z.string().min(1, 'Select a course'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  contentType: z.enum(['TEXT', 'VIDEO', 'FILE']),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  content: z.string().min(3, 'Content is required'),
})

export type LessonFormData = z.infer<typeof lessonSchema>

export const contentTypeLabels = { TEXT: 'Text', VIDEO: 'Video', FILE: 'File' } as const
