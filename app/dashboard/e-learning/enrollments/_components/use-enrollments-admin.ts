'use client'

import { useEffect, useState } from 'react'

export interface EnrollmentRecord {
  id: string
  userId: string
  member: string
  courseId: string
  courseTitle: string
  enrolledAt: string
  status: string
  progress: number
}

/** Real fetch()-backed Enrollment store for the admin Enrollments Management page, replacing the mix of a 5-row static mock plus one ad hoc "live John Doe row" derivation. */
let cache: EnrollmentRecord[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadEnrollments(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/enrollments?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch enrollments (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch enrollments')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useEnrollmentsAdmin() {
  const [data, setData] = useState<EnrollmentRecord[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadEnrollments()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load enrollments'))
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
