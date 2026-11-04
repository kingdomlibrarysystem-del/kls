export type { Lesson, LessonContentType, LessonStatus, CourseLessons } from '@/app/member/_shared/lesson-data'
import type { LessonContentType, LessonStatus } from '@/app/member/_shared/lesson-data'

export const contentTypeConfig: Record<LessonContentType, { label: string; cls: string }> = {
  VIDEO: { label: 'Video', cls: 'bg-blue-50 dark:bg-info/10 text-blue-800 border-blue-200 dark:border-info/30' },
  TEXT: { label: 'Text', cls: 'bg-w-100 text-w-700 border-w-300' },
  FILE: { label: 'File', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
}

export const lessonStatusConfig: Record<LessonStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-w-100 text-w-700 border-w-300' },
  PUBLISHED: { label: 'Published', cls: 'bg-green-50 dark:bg-success/10 text-green-800 dark:text-success border-green-200 dark:border-success/30' },
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
  status: LessonStatus
}
