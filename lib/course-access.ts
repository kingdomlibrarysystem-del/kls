/**
 * Who may open a lesson or take an assessment — ONE set of rules shared by
 * the API (which enforces them) and the pages (which show locks and prices).
 * No Prisma here, so client code can import it.
 *
 * Admin controls (course + lesson forms):
 * - Course price (RWF): 0 = the whole course is free.
 * - Lesson access:
 *     COURSE — follows the course: open in a free course, needs the course
 *              payment in a paid course (the default).
 *     FREE   — open to everyone, even in a paid course (a free preview).
 *     PAID   — its own price: a member can buy just this lesson; in a paid
 *              course, paying the whole course opens it too.
 * - Quizzes and tests follow their lesson; the exam, projects and quizzes
 *   without a lesson follow the course.
 */

export type LessonAccess = 'COURSE' | 'FREE' | 'PAID'

export const LESSON_ACCESS: LessonAccess[] = ['COURSE', 'FREE', 'PAID']

export interface AccessLesson {
  id: string
  access?: LessonAccess | string | null
  price?: number | null
}

export interface AccessEnrollment {
  paid: boolean
  status?: string
  unlockedLessonIds?: string[] | null
}

/** The lesson's access, with old lessons (no value) and a PAID lesson without a price treated as COURSE. */
export function lessonAccessOf(lesson: AccessLesson): LessonAccess {
  if (lesson.access === 'FREE') return 'FREE'
  if (lesson.access === 'PAID' && (lesson.price ?? 0) > 0) return 'PAID'
  return 'COURSE'
}

/** A member's enrollment counts only while they have not left the course. */
const active = (e?: AccessEnrollment | null) => (e && e.status !== 'DROPPED' ? e : undefined)

/** True when this member (or a visitor, with no enrollment) may open the lesson. */
export function lessonIsOpen(lesson: AccessLesson, coursePrice: number, enrollment?: AccessEnrollment | null): boolean {
  const access = lessonAccessOf(lesson)
  if (access === 'FREE') return true
  const e = active(enrollment)
  if (e?.unlockedLessonIds?.includes(lesson.id)) return true
  if (coursePrice > 0) return !!e?.paid
  // Free course: every lesson that follows the course is open; a priced lesson must be bought.
  return access === 'COURSE'
}

/** True when the course itself is paid for (or free) — what the exam and projects need. */
export function courseIsOpen(coursePrice: number, enrollment?: AccessEnrollment | null): boolean {
  return coursePrice > 0 ? !!active(enrollment)?.paid : true
}

/** A quiz/test follows its lesson; the exam, projects and lesson-less quizzes follow the course. */
export function assessmentIsOpen(
  assessment: { lessonId?: string | null },
  lessonsById: Map<string, AccessLesson> | Record<string, AccessLesson>,
  coursePrice: number,
  enrollment?: AccessEnrollment | null,
): boolean {
  const lesson = assessment.lessonId
    ? lessonsById instanceof Map ? lessonsById.get(assessment.lessonId) : lessonsById[assessment.lessonId]
    : undefined
  return lesson ? lessonIsOpen(lesson, coursePrice, enrollment) : courseIsOpen(coursePrice, enrollment)
}

/** What a member can pay to open a locked lesson: the whole course and/or just this lesson. */
export function unlockOptions(lesson: AccessLesson, coursePrice: number): { course?: number; lesson?: number } {
  const access = lessonAccessOf(lesson)
  return {
    ...(coursePrice > 0 && access !== 'FREE' && { course: coursePrice }),
    ...(access === 'PAID' && { lesson: lesson.price ?? 0 }),
  }
}
