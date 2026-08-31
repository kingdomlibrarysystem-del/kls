'use client'

import { useEffect, useState } from 'react'

/**
 * Real fetch()-backed course catalog, replacing course-catalog-data.ts's
 * static mock array (numeric ids '1'-'12', not real Mongo ObjectIds).
 * Backed by the real /api/courses, which itself already consolidated the
 * admin/member/public-preview mocks into one Course collection (see that
 * route's own docstring) — mirrors the fetch pattern already established by
 * use-lessons.ts/use-assessments.ts. Only PUBLISHED courses are shown to
 * members, matching what a learner should be able to browse/enroll in.
 */
export interface CatalogCourse {
  id: string
  title: string
  instructor: string
  /** Real lecturer User id, resolved server-side from Course.lecturerId — undefined when no lecturer is assigned. */
  lecturerId?: string
  category: string
  lessons: number
  duration: string
  rating: string
  students: number
  image: string
  description: string
  /** RWF; 0 means free. */
  price: number
}

interface ApiCourse {
  id: string
  title: string
  description: string
  category: string
  status: string
  lecturerId?: string
  instructor?: string
  image?: string
  duration?: string
  rating?: string
  price: number
  lessons: number
  students: number
}

function toCatalogCourse(c: ApiCourse): CatalogCourse {
  return {
    id: c.id,
    title: c.title,
    instructor: c.instructor ?? 'Unassigned',
    lecturerId: c.lecturerId,
    category: c.category,
    lessons: c.lessons,
    duration: c.duration ?? '—',
    rating: c.rating ?? '—',
    students: c.students,
    image: c.image ?? '',
    description: c.description,
    price: c.price,
  }
}

let cache: CatalogCourse[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadCourses(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/courses?status=PUBLISHED&pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch courses (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch courses')
      cache = (json.data as ApiCourse[]).map(toCatalogCourse)
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useCourses() {
  const [data, setData] = useState<CatalogCourse[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadCourses()
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

/** Fetches a single course by id directly (used by the public course-preview page, which has no enrollment/lesson context to derive it from a list). */
export async function fetchCourseById(id: string): Promise<CatalogCourse | undefined> {
  const res = await fetch(`/api/courses/${id}`)
  if (!res.ok) return undefined
  const json = await res.json()
  if (json.code !== 'success' || !json.data) return undefined
  return toCatalogCourse(json.data)
}
