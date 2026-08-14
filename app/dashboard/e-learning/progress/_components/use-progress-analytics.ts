'use client'

import { useEffect, useState } from 'react'
import type { CourseAnalytics } from './progress-data'

/**
 * Real fetch()-backed course-progress-analytics store, replacing
 * progress-data.ts's four hand-typed CourseAnalytics rows. Module-level
 * cache — same pattern as use-library-reports.ts — since the card grid
 * and the detail modal both read this independently.
 */
let cache: CourseAnalytics[] | null = null
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadAnalytics(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/reports/e-learning-progress')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch progress analytics (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch progress analytics')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useProgressAnalytics() {
  const [data, setData] = useState<CourseAnalytics[]>(cache ?? [])
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData(cache ?? [])
    listeners.add(listener)
    if (!hasFetched) {
      loadAnalytics()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load progress analytics'))
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
