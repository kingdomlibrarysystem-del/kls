import { z } from 'zod'

/** Languages a course can be authored in, per APP_DOC Phase 9 (en/fr/rw). */
export const courseLanguages = ['en', 'fr', 'rw'] as const

/** Course lifecycle status, per APP_DOC Task 6.1 / Prisma `Course.status`. */
export const courseStatuses = ['DRAFT', 'PUBLISHED'] as const

export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  language: z.enum(courseLanguages, { message: 'Select a language' }),
  status: z.enum(courseStatuses, { message: 'Select a status' }),
})

export type CourseFormData = z.infer<typeof courseSchema>

export const courseCategories = [
  'Theology',
  'Discipleship',
  'Leadership',
  'Family & Marriage',
  'Youth Ministry',
  'Missions',
] as const

export const languageLabels: Record<(typeof courseLanguages)[number], string> = {
  en: 'English',
  fr: 'Français',
  rw: 'Kinyarwanda',
}
