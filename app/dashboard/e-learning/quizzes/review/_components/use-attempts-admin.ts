'use client'

import { useEffect, useState } from 'react'

export interface AttemptRecord {
  id: string
  userId: string
  assessmentId: string
  status: string
  reviewStatus: string
  score: number
  totalMarks: number
  takenAt: string
  openAnswers?: Record<string, string>
  openScores?: Record<string, number>
}

/**
 * Real fetch()-backed AssessmentAttempt store for the admin Review Queue.
 * Grading is genuinely an admin-only action (no "current user" needed —
 * the grader isn't the attempt's owner), so unlike the member take-quiz
 * submission path (still on app/member/_shared/use-assessment-attempts.ts's
 * mock pending real auth), this read/grade surface is fully real.
 */
let cache: AttemptRecord[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadAttempts(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/assessment-attempts?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch assessment attempts (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch assessment attempts')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useAttemptsAdmin() {
  const [data, setData] = useState<AttemptRecord[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadAttempts()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load assessment attempts'))
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

export async function refetchAttemptsAdmin(): Promise<void> {
  hasFetched = false
  await loadAttempts()
}

export async function gradeAttempt(id: string, openScores: Record<string, number>): Promise<AttemptRecord> {
  const res = await fetch(`/api/assessment-attempts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'gradeOpenAnswers', openScores }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to grade attempt')
  await refetchAttemptsAdmin()
  return json.data
}
