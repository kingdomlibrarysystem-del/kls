import { z } from 'zod'

/** Languages a course can be authored in, per APP_DOC Phase 9 (en/fr/rw). */
export const courseLanguages = ['en', 'fr', 'rw'] as const

/** Course lifecycle status, per APP_DOC Task 6.1 / Prisma `Course.status`. */
export const courseStatuses = ['DRAFT', 'PUBLISHED'] as const

export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  /**
   * Free-text course category name — sourced from the admin-managed
   * CourseCategory collection (see use-course-categories.ts), not a
   * hardcoded list. Kept as a String rather than a FK so existing courses
   * with legacy free-text values don't break and no data migration is
   * needed; the dropdown only offers real CourseCategory names.
   */
  category: z.string().min(1, 'Category is required'),
  language: z.enum(courseLanguages, { message: 'Select a language' }),
  status: z.enum(courseStatuses, { message: 'Select a status' }),
  /** Real User.id of any real platform user, or '' for no assigned instructor (e.g. a platform-authored course). */
  lecturerId: z.string().optional(),
  /** Real Cloudinary secure_url from CourseFormView's upload field, or '' for no cover image. */
  image: z.string().optional(),
})

export type CourseFormData = z.infer<typeof courseSchema>

export const languageLabels: Record<(typeof courseLanguages)[number], string> = {
  en: 'English',
  fr: 'Français',
  rw: 'Kinyarwanda',
}
