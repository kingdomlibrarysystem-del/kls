'use client'

import { useEffect, useState } from 'react'
import type { CounselingSession } from './counseling-data'

/** Real fetch()-backed admin-wide CounselingSession store, mirrors use-borrowings-admin.ts (paginated, staff-only, no per-user keying). */
let cache: CounselingSession[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadSessions(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/counseling/sessions?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch counseling sessions (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch counseling sessions')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useCounselingSessionsAdmin() {
  const [data, setData] = useState<CounselingSession[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadSessions()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load counseling sessions'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchCounselingSessionsAdmin(): Promise<void> {
  hasFetched = false
  await loadSessions()
}

async function patchSession(id: string, status: string): Promise<CounselingSession> {
  const res = await fetch(`/api/counseling/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update session')
  await refetchCounselingSessionsAdmin()
  return json.data
}

export function confirmSession(id: string) {
  return patchSession(id, 'CONFIRMED')
}
export function completeSession(id: string) {
  return patchSession(id, 'COMPLETED')
}
export function cancelSessionAdmin(id: string) {
  return patchSession(id, 'CANCELLED')
}

export async function addCounselingNote(sessionId: string, userId: string, authorId: string, summary: string, followUp?: string) {
  const res = await fetch('/api/counseling/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId, authorId, summary, followUp }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to add note')
  return json.data
}
