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
  /** Course author, used by `/contributor/courses` to filter to the signed-in contributor's own courses. */
  author: string
}

export const initialCourseCatalog: CourseCatalogEntry[] = [
  {
    id: 'crs-001',
    title: 'Foundations of Faith',
    description: 'An introductory survey of core Christian doctrine and practice.',
    category: 'Theology',
    language: 'en',
    status: 'PUBLISHED',
    enrolledCount: 3,
    createdAt: '2026-01-15',
    author: 'Kingdom Library System',
  },
  {
    id: 'crs-002',
    title: 'Digital Discipleship',
    description: 'Using digital tools to mentor and disciple believers remotely.',
    category: 'Discipleship',
    language: 'en',
    status: 'PUBLISHED',
    enrolledCount: 1,
    createdAt: '2026-02-03',
    author: 'Kingdom Library System',
  },
  {
    id: 'crs-003',
    title: 'Family & Marriage 101',
    description: 'Biblical foundations for building healthy marriages and family life.',
    category: 'Family & Marriage',
    language: 'en',
    status: 'PUBLISHED',
    enrolledCount: 1,
    createdAt: '2026-02-20',
    author: 'Kingdom Library System',
  },
  {
    id: 'crs-004',
    title: 'Leadership for Youth Pastors',
    description: 'Practical leadership training tailored to youth ministry contexts.',
    category: 'Youth Ministry',
    language: 'en',
    status: 'PUBLISHED',
    enrolledCount: 1,
    createdAt: '2026-03-01',
    author: 'Kingdom Library System',
  },
  {
    id: 'crs-005',
    title: 'Leadership for Ministry Teams',
    description: 'Equipping ministry team leaders with practical, Kingdom-centered leadership skills.',
    category: 'Leadership',
    language: 'en',
    status: 'PUBLISHED',
    enrolledCount: 12,
    createdAt: '2026-03-10',
    author: 'Pastor Emmanuel Rugamba',
  },
  {
    id: 'crs-006',
    title: 'Missions & Outreach',
    description: 'Principles and practice of cross-cultural missions and local outreach.',
    category: 'Missions',
    language: 'en',
    status: 'PUBLISHED',
    enrolledCount: 1,
    createdAt: '2026-03-18',
    author: 'Kingdom Library System',
  },
]
