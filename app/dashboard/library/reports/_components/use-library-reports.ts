'use client'

import { useEffect, useState } from 'react'
import type { OverdueEntry, TopResourceEntry, FineEntry } from './reports-data'

export interface LibraryReports {
  overdueList: OverdueEntry[]
  topResources: TopResourceEntry[]
  fineCollection: FineEntry[]
}

/**
 * Real fetch()-backed Library Reports store, replacing reports-data.ts's
 * three hand-typed arrays. Module-level cache (same pattern as every
 * other real-data hook in this app) so the five components on this page
 * that each independently call this hook share one fetch.
 */
let cache: LibraryReports | null = null
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadReports(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/reports/library')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch library reports (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch library reports')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useLibraryReports() {
  const [data, setData] = useState<LibraryReports | null>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData(cache)
    listeners.add(listener)
    if (!hasFetched) {
      loadReports()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load library reports'))
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
