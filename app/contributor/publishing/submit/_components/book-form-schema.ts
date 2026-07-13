import { z } from 'zod'

/** Languages a publication can be authored in, per APP_DOC Phase 9 (en/fr/rw). */
export const bookLanguages = ['en', 'fr', 'rw'] as const

/** Resulting Publication status depending on which submit action is used. */
export type SubmitAction = 'draft' | 'review'

export const bookSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  language: z.enum(bookLanguages, { message: 'Select a language' }),
})

export type BookFormData = z.infer<typeof bookSchema>

export const bookCategories = [
  'Theology',
  'Discipleship',
  'Leadership',
  'Family & Marriage',
  'Youth Ministry',
  'Missions',
] as const

export const languageLabels: Record<(typeof bookLanguages)[number], string> = {
  en: 'English',
  fr: 'Français',
  rw: 'Kinyarwanda',
}
