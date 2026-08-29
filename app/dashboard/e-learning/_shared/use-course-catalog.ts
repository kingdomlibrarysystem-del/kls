'use client'

import { useEffect, useState } from 'react'
import type { CourseCatalogEntry } from './course-catalog-data'

/**
 * Real fetch()-backed Course store, replacing the module-level mock
 * array shared by the Add-Course form and admin Course Catalog list.
 * Now backed by the real Course collection (Phase 5), which also
 * unifies what used to be three separate catalogs (admin/member/public
 * preview) — this hook reads the same collection the member browse
 * pages read, just without a status filter.
 */
let cache: CourseCatalogEntry[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadCatalog(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/courses?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch courses (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch courses')
      cache = json.data.map((c: { id: string; title: string; description: string; category: string; language: string; status: string; author: string; lecturerId?: string; image?: string; createdAt: string; students?: number }) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        language: c.language,
        status: c.status,
        enrolledCount: c.students ?? 0,
        createdAt: c.createdAt,
        author: c.author,
        lecturerId: c.lecturerId,
        image: c.image,
      }))
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useCourseCatalog() {
  const [data, setData] = useState<CourseCatalogEntry[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadCatalog()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load courses'))
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

export async function refetchCourseCatalog(): Promise<void> {
  hasFetched = false
  await loadCatalog()
}

export async function addCourseToCatalog(entry: Omit<CourseCatalogEntry, 'id' | 'enrolledCount' | 'createdAt'>): Promise<CourseCatalogEntry> {
  const res = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to create course')
  await refetchCourseCatalog()
  return json.data
}

export async function updateCourseInCatalog(id: string, updates: Partial<Omit<CourseCatalogEntry, 'id'>>): Promise<CourseCatalogEntry> {
  const res = await fetch(`/api/courses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update course')
  await refetchCourseCatalog()
  return json.data
}

export function archiveCourseInCatalog(id: string) {
  return updateCourseInCatalog(id, { status: 'DRAFT' })
}

export async function removeCourseFromCatalog(id: string): Promise<void> {
  const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to delete course')
  await refetchCourseCatalog()
}
