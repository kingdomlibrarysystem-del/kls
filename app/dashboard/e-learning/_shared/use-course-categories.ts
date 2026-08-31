'use client'

import { useEffect, useState } from 'react'

export interface CourseCategory {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * Real fetch()-backed course-categories store — replaces the hardcoded
 * `courseCategories` const tuple in course-form-schema.ts with a live,
 * CRUD-backed list so an admin can manage the vocab from the
 * /dashboard/e-learning/categories page and the Add/Edit course forms see
 * the current options immediately. Mirrors the useCourseCatalog/
 * taxonomy-helpers async-store pattern: a module-level cache populated
 * once, subscribed to via a React hook, refetched after every mutation.
 */
let cache: CourseCategory[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadCategories(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/course-categories')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch course categories (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch course categories')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

export function useCourseCategories() {
  const [data, setData] = useState<CourseCategory[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadCategories()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load course categories'))
        .finally(() => setLoading(false))
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { data, loading, error }
}

export async function refetchCourseCategories(): Promise<void> {
  hasFetched = false
  await loadCategories()
}

export async function addCourseCategory(input: { name: string; description?: string }): Promise<CourseCategory> {
  const res = await fetch('/api/course-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create course category')
  await refetchCourseCategories()
  return json.data
}

export async function updateCourseCategory(id: string, updates: Partial<{ name: string; description?: string }>): Promise<CourseCategory> {
  const res = await fetch(`/api/course-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update course category')
  await refetchCourseCategories()
  return json.data
}

export async function removeCourseCategory(id: string): Promise<void> {
  const res = await fetch(`/api/course-categories/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete course category')
  await refetchCourseCategories()
}
