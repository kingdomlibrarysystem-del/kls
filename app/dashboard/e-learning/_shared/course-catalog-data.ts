import { courseCategories, courseLanguages, courseStatuses } from '../add/_components/course-form-schema'

/** Course category, per `course-form-schema.ts`'s admin-facing category list. */
export type CourseCategory = (typeof courseCategories)[number]

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
  category: CourseCategory | string
  language: CourseLanguage
  status: CourseStatus
  enrolledCount: number
  createdAt: string
  /** Course author, used by the catalog's own "Author" filter (previously `/contributor/courses`'s filter before that portal was consolidated into admin). */
  author: string
  /**
   * Real link to `lecturerRoster` (see app/lecturer/_components/lecturer-identity.ts)
   * — the same roster app/member/_shared/course-catalog-data.ts's `CatalogCourse.lecturerId`
   * already points at. Added so admin's own course management can display/assign an
   * instructor of record without needing a separate lecturer-facing dataset — this
   * catalog and the member-facing one remain intentionally separate (different
   * lifecycles: authoring/business vs. the taken-course experience), but both now
   * resolve "who teaches this" through the same roster. Optional: not every admin
   * course has an assigned instructor (e.g. platform-authored courses).
   */
  lecturerId?: string
}
