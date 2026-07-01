/** Lesson content type, per kls-product-spec Task 6.2 / Prisma `Lesson.content_type`. */
export type LessonContentType = 'TEXT' | 'VIDEO' | 'FILE'

export interface Lesson {
  id: string
  title: string
  contentType: LessonContentType
  durationMinutes: number
  content: string
  completed: boolean
}

export interface CourseLessons {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
}

/** Mock lessons keyed by the numeric course IDs used in member/courses/page.tsx. */
export const courseLessons: Record<string, CourseLessons> = {
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
    ],
  },
}
