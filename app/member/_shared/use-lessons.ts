'use client'

import { useSyncExternalStore } from 'react'
import { initialCourseLessons, type CourseLessons, type Lesson, type LessonContentType } from './lesson-data'

/**
 * Module-level mutable store so the member lesson viewer and the admin
 * Lessons management page (/dashboard/e-learning/lessons) share one lesson
 * catalog across route navigations, without a backend. An admin edit here
 * must be visible to the member taking the course, so this is intentionally
 * NOT scoped to admin-only like the course-catalog store in
 * app/dashboard/e-learning/_shared/ — see lesson-data.ts's docstring.
 */
let byCourse: Record<string, CourseLessons> = structuredClone(initialCourseLessons)
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return byCourse
}

/** Non-hook accessor for use outside React components/render (e.g. other store modules). */
export function getLessonsSnapshot() {
  return byCourse
}

function nextLessonId(courseId: string) {
  const lessons = byCourse[courseId]?.lessons ?? []
  const max = lessons.reduce((m, l) => {
    const n = Number(l.id.replace('l-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `l-${max + 1}`
}

export interface AddLessonInput {
  title: string
  contentType: LessonContentType
  durationMinutes: number
  content: string
}

/** Appends a new lesson to a course, creating the course's lesson list if it doesn't exist yet. */
export function addLesson(courseId: string, courseTitle: string, input: AddLessonInput): Lesson {
  const created: Lesson = { id: nextLessonId(courseId), completed: false, ...input }
  const existing = byCourse[courseId] ?? { courseId, courseTitle, lessons: [] }
  byCourse = { ...byCourse, [courseId]: { ...existing, lessons: [...existing.lessons, created] } }
  emitChange()
  return created
}

export function updateLesson(courseId: string, lessonId: string, updates: Partial<AddLessonInput>) {
  const course = byCourse[courseId]
  if (!course) return
  byCourse = {
    ...byCourse,
    [courseId]: { ...course, lessons: course.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)) },
  }
  emitChange()
}

export function removeLesson(courseId: string, lessonId: string) {
  const course = byCourse[courseId]
  if (!course) return
  byCourse = { ...byCourse, [courseId]: { ...course, lessons: course.lessons.filter((l) => l.id !== lessonId) } }
  emitChange()
}

/** Swaps a lesson with its immediate neighbor to reorder the course's lesson list. */
export function reorderLesson(courseId: string, lessonId: string, direction: 'up' | 'down') {
  const course = byCourse[courseId]
  if (!course) return
  const index = course.lessons.findIndex((l) => l.id === lessonId)
  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || swapWith < 0 || swapWith >= course.lessons.length) return
  const lessons = [...course.lessons]
  ;[lessons[index], lessons[swapWith]] = [lessons[swapWith], lessons[index]]
  byCourse = { ...byCourse, [courseId]: { ...course, lessons } }
  emitChange()
}

/** Live-subscribes to the shared lesson catalog, keyed by course ID. */
export function useLessonsByCourse() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialCourseLessons)
}
