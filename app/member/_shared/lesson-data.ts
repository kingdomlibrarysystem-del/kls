/** Lesson content type, per kls-product-spec Task 6.2 / Prisma `Lesson.content_type`. */
export type LessonContentType = 'TEXT' | 'VIDEO' | 'FILE'

export interface Lesson {
  id: string
  title: string
  contentType: LessonContentType
  durationMinutes: number
  content: string
  /** Real markdown-authored lesson body — every lesson in the catalog has this populated; falls back to the contentType-based `content` field when absent (e.g. a lesson created before the markdown editor existed). */
  contentMarkdown?: string
  completed: boolean
}

export interface CourseLessons {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
}

/**
 * Canonical lesson content keyed by the course IDs in course-catalog-data.ts.
 * Lives in `_shared` (not under the member lesson-viewer route) because both
 * the member lesson viewer and the admin Lessons management page
 * (/dashboard/e-learning/lessons) read and, on the admin side, write this
 * same data — an admin edit must be visible to the member taking the
 * course, so this cannot be two separate datasets. `completed` here only
 * seeds the initial enrollment store snapshot — after that, completion
 * state lives in the enrollment store, not here.
 */
export const initialCourseLessons: Record<string, CourseLessons> = {
  '1': {
    courseId: '1',
    courseTitle: 'Kingdom Foundations',
    lessons: [
      { id: 'l-1', title: 'Origins and Covenant', contentType: 'VIDEO', durationMinutes: 18, content: 'A video walkthrough of Kingdom origins and covenant relationship.', completed: true },
      { id: 'l-2', title: 'Identity and Authority', contentType: 'TEXT', durationMinutes: 12, content: 'This lesson explores what it means to carry Kingdom identity and delegated authority in daily life. Read through the material below and reflect on the discussion questions at the end.', completed: true },
      { id: 'l-3', title: 'Reading Guide: Foundation Scrolls', contentType: 'FILE', durationMinutes: 5, content: 'foundation-reading-guide.pdf', completed: false },
      { id: 'l-4', title: 'Covenant in Practice', contentType: 'VIDEO', durationMinutes: 22, content: 'A recorded teaching session on applying covenant principles today.', completed: false },
    ],
  },
  '2': {
    courseId: '2',
    courseTitle: 'Understanding Divine Purpose',
    lessons: [
      { id: 'l-1', title: 'Discovering Purpose', contentType: 'VIDEO', durationMinutes: 20, content: 'An introductory session on discovering personal purpose within the Kingdom narrative.', completed: true },
      { id: 'l-2', title: 'Purpose and Calling', contentType: 'TEXT', durationMinutes: 15, content: 'This lesson distinguishes between purpose and calling, and how the two work together to shape a life of meaning.', completed: false },
      { id: 'l-3', title: 'Purpose Under Pressure', contentType: 'VIDEO', durationMinutes: 17, content: 'A teaching on sustaining a sense of purpose through seasons of difficulty.', completed: false },
      { id: 'l-4', title: 'Worksheet: Naming Your Purpose', contentType: 'FILE', durationMinutes: 8, content: 'naming-your-purpose-worksheet.pdf', completed: false },
    ],
  },
  '3': {
    courseId: '3',
    courseTitle: 'Leadership & Governance',
    lessons: [
      { id: 'l-1', title: 'Foundations of Kingdom Leadership', contentType: 'VIDEO', durationMinutes: 19, content: 'An overview of what distinguishes Kingdom leadership from worldly authority.', completed: true },
      { id: 'l-2', title: 'Servant Governance', contentType: 'TEXT', durationMinutes: 14, content: 'This lesson examines how governance in the Kingdom is exercised through service rather than domination.', completed: false },
      { id: 'l-3', title: 'Case Study: Leadership Failures and Recovery', contentType: 'VIDEO', durationMinutes: 21, content: 'A recorded case study on historical leadership failures and the path to restoration.', completed: false },
      { id: 'l-4', title: 'Reading Guide: Governance Structures', contentType: 'FILE', durationMinutes: 6, content: 'governance-structures-guide.pdf', completed: false },
    ],
  },
  '4': {
    courseId: '4',
    courseTitle: 'The Art of Worship',
    lessons: [
      { id: 'l-1', title: 'Worship as Lifestyle', contentType: 'VIDEO', durationMinutes: 16, content: 'An introduction to worship as a continuous posture rather than a single act.', completed: true },
      { id: 'l-2', title: 'The Language of Praise', contentType: 'TEXT', durationMinutes: 10, content: 'This lesson explores the vocabulary and expressions of praise found across the Psalms.', completed: true },
      { id: 'l-3', title: 'Worship in Community', contentType: 'VIDEO', durationMinutes: 18, content: 'A teaching session on corporate worship and its role in shaping identity.', completed: true },
      { id: 'l-4', title: 'Personal Worship Playlist', contentType: 'FILE', durationMinutes: 4, content: 'worship-playlist-guide.pdf', completed: true },
    ],
  },
  '5': {
    courseId: '5',
    courseTitle: 'Kingdom Marriage Principles',
    lessons: [
      { id: 'l-1', title: 'Marriage as Covenant', contentType: 'VIDEO', durationMinutes: 20, content: 'An introductory session framing marriage as a covenant relationship, not a contract.', completed: false },
      { id: 'l-2', title: 'Communication and Conflict', contentType: 'TEXT', durationMinutes: 13, content: 'This lesson addresses healthy communication patterns and resolving conflict without division.', completed: false },
      { id: 'l-3', title: 'Roles and Mutual Submission', contentType: 'VIDEO', durationMinutes: 19, content: 'A teaching on shared responsibility and mutual submission within marriage.', completed: false },
      { id: 'l-4', title: 'Worksheet: Marriage Health Check', contentType: 'FILE', durationMinutes: 7, content: 'marriage-health-check.pdf', completed: false },
    ],
  },
  '6': {
    courseId: '6',
    courseTitle: 'Financial Stewardship',
    lessons: [
      { id: 'l-1', title: 'Stewardship, Not Ownership', contentType: 'VIDEO', durationMinutes: 15, content: 'An introduction to viewing resources as entrusted rather than owned.', completed: false },
      { id: 'l-2', title: 'Budgeting with Purpose', contentType: 'TEXT', durationMinutes: 11, content: 'This lesson covers practical budgeting principles rooted in Kingdom stewardship values.', completed: false },
      { id: 'l-3', title: 'Giving and Generosity', contentType: 'VIDEO', durationMinutes: 17, content: 'A recorded teaching on the role of generosity in financial health.', completed: false },
      { id: 'l-4', title: 'Reading Guide: Debt-Free Living', contentType: 'FILE', durationMinutes: 6, content: 'debt-free-living-guide.pdf', completed: false },
    ],
  },
  '7': {
    courseId: '7',
    courseTitle: 'Prayer & Meditation',
    lessons: [
      { id: 'l-1', title: 'The Discipline of Prayer', contentType: 'VIDEO', durationMinutes: 14, content: 'An introduction to building a consistent, sustainable prayer discipline.', completed: false },
      { id: 'l-2', title: 'Meditative Reading', contentType: 'TEXT', durationMinutes: 9, content: 'This lesson introduces meditative approaches to reading scripture slowly and reflectively.', completed: false },
      { id: 'l-3', title: 'Prayer in Difficult Seasons', contentType: 'VIDEO', durationMinutes: 16, content: 'A teaching session on sustaining prayer during trial and uncertainty.', completed: false },
      { id: 'l-4', title: 'Worksheet: A 7-Day Prayer Plan', contentType: 'FILE', durationMinutes: 5, content: '7-day-prayer-plan.pdf', completed: false },
    ],
  },
  '8': {
    courseId: '8',
    courseTitle: 'The Nature of God',
    lessons: [
      { id: 'l-1', title: 'Attributes of God', contentType: 'VIDEO', durationMinutes: 22, content: 'An overview of the core attributes traditionally ascribed to God’s nature.', completed: false },
      { id: 'l-2', title: 'God as Father, King, and Judge', contentType: 'TEXT', durationMinutes: 16, content: 'This lesson examines three central biblical portraits of God and what each reveals.', completed: false },
      { id: 'l-3', title: 'Knowing God Relationally', contentType: 'VIDEO', durationMinutes: 20, content: 'A teaching session on moving from knowledge about God to relationship with God.', completed: false },
      { id: 'l-4', title: 'Reading Guide: Names of God', contentType: 'FILE', durationMinutes: 6, content: 'names-of-god-guide.pdf', completed: false },
    ],
  },
  '9': {
    courseId: '9',
    courseTitle: 'Spiritual Authority',
    lessons: [
      { id: 'l-1', title: 'Understanding Delegated Authority', contentType: 'VIDEO', durationMinutes: 18, content: 'An introduction to how spiritual authority is delegated and exercised responsibly.', completed: false },
      { id: 'l-2', title: 'Authority and Accountability', contentType: 'TEXT', durationMinutes: 12, content: 'This lesson pairs the exercise of authority with the accountability that must accompany it.', completed: false },
      { id: 'l-3', title: 'Authority Under Pressure', contentType: 'VIDEO', durationMinutes: 19, content: 'A recorded teaching on maintaining spiritual authority through opposition.', completed: false },
      { id: 'l-4', title: 'Case Studies: Authority Misused', contentType: 'FILE', durationMinutes: 7, content: 'authority-misused-case-studies.pdf', completed: false },
    ],
  },
  '10': {
    courseId: '10',
    courseTitle: 'Building Healthy Relationships',
    lessons: [
      { id: 'l-1', title: 'Foundations of Healthy Relationship', contentType: 'VIDEO', durationMinutes: 15, content: 'An introduction to trust, boundaries, and mutual respect in relationships.', completed: false },
      { id: 'l-2', title: 'Conflict Without Division', contentType: 'TEXT', durationMinutes: 11, content: 'This lesson offers a framework for resolving conflict while preserving relationship.', completed: false },
      { id: 'l-3', title: 'Community and Belonging', contentType: 'VIDEO', durationMinutes: 17, content: 'A teaching session on cultivating genuine community and a sense of belonging.', completed: false },
      { id: 'l-4', title: 'Worksheet: Relationship Inventory', contentType: 'FILE', durationMinutes: 6, content: 'relationship-inventory.pdf', completed: false },
    ],
  },
  '11': {
    courseId: '11',
    courseTitle: 'The Kingdom Economy',
    lessons: [
      { id: 'l-1', title: 'Kingdom Economics 101', contentType: 'VIDEO', durationMinutes: 21, content: 'An introduction to economic principles as taught through a Kingdom lens.', completed: false },
      { id: 'l-2', title: 'Work as Worship', contentType: 'TEXT', durationMinutes: 13, content: 'This lesson reframes daily work as a form of worship and Kingdom contribution.', completed: false },
      { id: 'l-3', title: 'Sowing, Reaping, and Multiplication', contentType: 'VIDEO', durationMinutes: 19, content: 'A recorded teaching on the principles of sowing and multiplication.', completed: false },
      { id: 'l-4', title: 'Reading Guide: Kingdom Enterprise', contentType: 'FILE', durationMinutes: 8, content: 'kingdom-enterprise-guide.pdf', completed: false },
    ],
  },
  '12': {
    courseId: '12',
    courseTitle: 'Divine Health & Wellness',
    lessons: [
      { id: 'l-1', title: 'Health as Wholeness', contentType: 'VIDEO', durationMinutes: 17, content: 'An introduction to health as the integration of body, mind, and spirit.', completed: false },
      { id: 'l-2', title: 'Rest and Sabbath Rhythms', contentType: 'TEXT', durationMinutes: 10, content: 'This lesson explores rest as a spiritual discipline, not just a physical necessity.', completed: false },
      { id: 'l-3', title: 'Healing and Restoration', contentType: 'VIDEO', durationMinutes: 18, content: 'A teaching session on the process of healing across body, mind, and spirit.', completed: false },
      { id: 'l-4', title: 'Worksheet: Personal Wellness Plan', contentType: 'FILE', durationMinutes: 6, content: 'personal-wellness-plan.pdf', completed: false },
    ],
  },
}
