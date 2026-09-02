'use client'

import { useEffect, useState } from 'react'
import type { RehabIntake } from './rehab-data'

/** Real fetch()-backed admin-wide RehabIntake store, mirrors use-borrowings-admin.ts. Split from schedule admin per module's own line-count guidance. */
let cache: RehabIntake[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadIntakes(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/rehabilitation/intake?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch intakes (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch intakes')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useRehabIntakesAdmin() {
  const [data, setData] = useState<RehabIntake[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadIntakes()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load intakes'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchRehabIntakesAdmin(): Promise<void> {
  hasFetched = false
  await loadIntakes()
}

async function patchIntake(id: string, action: string, reviewNotes?: string): Promise<RehabIntake> {
  const res = await fetch(`/api/rehabilitation/intake/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reviewNotes }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update intake')
  await refetchRehabIntakesAdmin()
  return json.data
}

export function reviewIntake(id: string, notes?: string) {
  return patchIntake(id, 'review', notes)
}
export function createPlanFromIntake(id: string, notes?: string) {
  return patchIntake(id, 'createPlan', notes)
}
export function declineIntake(id: string, notes?: string) {
  return patchIntake(id, 'decline', notes)
}
