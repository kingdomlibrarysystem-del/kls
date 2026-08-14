export type { Lesson, LessonContentType, CourseLessons } from '@/app/member/_shared/lesson-data'
import type { LessonContentType } from '@/app/member/_shared/lesson-data'

export const contentTypeConfig: Record<LessonContentType, { label: string; cls: string }> = {
  VIDEO: { label: 'Video', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  TEXT: { label: 'Text', cls: 'bg-w-100 text-w-700 border-w-300' },
  FILE: { label: 'File', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
}

/** A lesson flattened with its parent course's identity, for the admin cross-course table. */
export interface LessonRow {
  courseId: string
  courseTitle: string
  lessonId: string
  order: number
  title: string
  contentType: LessonContentType
  durationMinutes: number
  content: string
  contentMarkdown?: string
}
