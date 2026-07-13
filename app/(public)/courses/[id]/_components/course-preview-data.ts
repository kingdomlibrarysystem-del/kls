/**
 * Public course-preview details, keyed by the same numeric IDs used in
 * `app/member/courses/page.tsx`'s `mockCourses` (title/instructor/lesson
 * count intentionally match that file rather than duplicating it wholesale
 * — only the description/duration fields a public preview needs are added
 * here).
 */
export interface CoursePreview {
  id: string
  title: string
  instructor: string
  description: string
  lessons: number
  durationMinutes: number
}

export const coursePreviews: Record<string, CoursePreview> = {
  '1': {
    id: '1',
    title: 'Kingdom Foundations',
    instructor: 'Dr. Elias Nkubito',
    description: 'An introduction to the constitutional root of Kingdom life — creation, covenant, identity, and authority — laying the groundwork for every course that follows.',
    lessons: 12,
    durationMinutes: 240,
  },
  '2': {
    id: '2',
    title: 'Understanding Divine Purpose',
    instructor: 'Dr. Elias Nkubito',
    description: 'Explores the difference between purpose and calling, and how discovering both shapes a life of lasting meaning within the Kingdom narrative.',
    lessons: 10,
    durationMinutes: 200,
  },
  '3': {
    id: '3',
    title: 'Leadership & Governance',
    instructor: 'Dr. Elias Nkubito',
    description: 'A study of Kingdom leadership patterns — authority, delegation, and servanthood — drawn from historical and prophetic examples.',
    lessons: 15,
    durationMinutes: 300,
  },
  '4': {
    id: '4',
    title: 'The Art of Worship',
    instructor: 'Dr. Elias Nkubito',
    description: 'A practical and theological look at worship as a Kingdom discipline, covering its history, forms, and place in daily life.',
    lessons: 8,
    durationMinutes: 160,
  },
}
