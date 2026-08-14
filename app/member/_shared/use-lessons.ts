'use client'

import { useEffect, useState } from 'react'
import type { Lesson, LessonContentType } from './lesson-data'

export interface CourseLessons {
  courseId: string
  courseTitle: string
  lessons: Lesson[]
}

/**
 * Real fetch()-backed lesson store, replacing the module-level
 * Record<courseId, CourseLessons> mock — already a single store shared
 * by the admin Lessons page and the member lesson viewer, now backed by
 * the real Lesson collection (Phase 5) instead. Fetches every lesson
 * across all courses in one call (matches the admin page's own
 * flatten-across-all-courses usage) and groups by courseId client-side.
 */
let cache: Record<string, CourseLessons> = {}
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

async function fetchCourseTitles(): Promise<Map<string, string>> {
  const res = await fetch('/api/courses?pageSize=1000')
  const json = await res.json()
  const map = new Map<string, string>()
  if (json.code === 'success') {
    for (const c of json.data) map.set(c.id, c.title)
  }
  return map
}

function loadLessons(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = Promise.all([
    fetch('/api/lessons?pageSize=1000').then((res) => res.json()),
    fetchCourseTitles(),
  ]).then(([json, courseTitles]) => {
    if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch lessons')
    const grouped: Record<string, CourseLessons> = {}
    for (const l of json.data) {
      const courseId = l.courseId
      if (!grouped[courseId]) {
        grouped[courseId] = { courseId, courseTitle: courseTitles.get(courseId) ?? '', lessons: [] }
      }
      grouped[courseId].lessons.push({
        id: l.id,
        title: l.title,
        contentType: l.contentType,
        durationMinutes: l.durationMinutes,
        content: l.content,
        contentMarkdown: l.contentMarkdown,
        completed: false,
      })
    }
    for (const course of Object.values(grouped)) {
      // Sorted by the API's own `order` field (already ascending from the
      // /api/lessons query), not re-sorted by id — a prior id-based sort
      // here would silently scramble lesson sequence whenever MongoDB
      // ObjectIds weren't created in the same order as `order` values.
    }
    cache = grouped
    hasFetched = true
    notify()
  }).finally(() => {
    fetchPromise = null
  })
  return fetchPromise
}

/** Non-hook accessor for use outside React components/render (e.g. other store modules like use-enrollments.ts). */
export function getLessonsSnapshot(): Record<string, CourseLessons> {
  return cache
}

export function useLessonsByCourse() {
  const [data, setData] = useState<Record<string, CourseLessons>>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData({ ...cache })
    listeners.add(listener)
    if (!hasFetched) {
      loadLessons()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load lessons'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { data, loading, error }
}

export async function refetchLessons(): Promise<void> {
  hasFetched = false
  await loadLessons()
}

export interface AddLessonInput {
  title: string
  contentType: LessonContentType
  durationMinutes: number
  content: string
  /** Real markdown-authored lesson body. */
  contentMarkdown?: string
}

export async function addLesson(courseId: string, _courseTitle: string, input: AddLessonInput): Promise<Lesson> {
  const res = await fetch('/api/lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, ...input }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create lesson')
  await refetchLessons()
  return { id: json.data.id, title: json.data.title, contentType: json.data.contentType, durationMinutes: json.data.durationMinutes, content: json.data.content, contentMarkdown: json.data.contentMarkdown, completed: false }
}

export async function updateLesson(_courseId: string, lessonId: string, updates: Partial<AddLessonInput>): Promise<void> {
  const res = await fetch(`/api/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update lesson')
  await refetchLessons()
}

export async function removeLesson(_courseId: string, lessonId: string): Promise<void> {
  const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete lesson')
  await refetchLessons()
}

/** Swaps a lesson with its immediate neighbor's `order` field via two real PATCH calls. */
export async function reorderLesson(courseId: string, lessonId: string, direction: 'up' | 'down'): Promise<void> {
  const course = cache[courseId]
  if (!course) return
  const res = await fetch(`/api/lessons?courseId=${courseId}&pageSize=100`)
  const json = await res.json()
  if (json.code !== 'success') return
  const ordered: { id: string; order: number }[] = json.data
  const index = ordered.findIndex((l) => l.id === lessonId)
  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return
  await Promise.all([
    fetch(`/api/lessons/${ordered[index].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ordered[swapWith].order }) }),
    fetch(`/api/lessons/${ordered[swapWith].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: ordered[index].order }) }),
  ])
  await refetchLessons()
}
