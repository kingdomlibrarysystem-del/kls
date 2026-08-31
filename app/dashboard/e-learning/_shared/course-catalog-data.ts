import { courseLanguages, courseStatuses } from '../add/_components/course-form-schema'

/** Course authoring language, per APP_DOC Phase 9 (en/fr/rw). */
export type CourseLanguage = (typeof courseLanguages)[number]

/** Course lifecycle status, per APP_DOC Task 6.1 / Prisma `Course.status`. */
export type CourseStatus = (typeof courseStatuses)[number]

/**
 * A course in the admin e-learning catalog. This is the shared, in-memory
 * source of truth for the `/dashboard/e-learning/*` module only — it is
 * intentionally not wired to `/contributor/courses` or `/member/courses`,
 * which each maintain their own separate mock datasets.
 */
export interface CourseCatalogEntry {
  id: string
  title: string
  description: string
  /** Admin-managed free-text category name (sourced from the CourseCategory collection). */
  category: string
  language: CourseLanguage
  status: CourseStatus
  enrolledCount: number
  createdAt: string
  /** Course author, used by the catalog's own "Author" filter (previously `/contributor/courses`'s filter before that portal was consolidated into admin). */
  author: string
  /** Real User.id of any real platform user assigned as this course's instructor of record — resolved via GET /api/users, not a hardcoded roster. Optional: not every admin course has an assigned instructor (e.g. platform-authored courses). */
  lecturerId?: string
  /** Real Cloudinary secure_url for the course's cover image, or undefined if none set. */
  image?: string
}
