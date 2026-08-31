'use client'

import { useEffect, useState } from 'react'
import type { SessionRequest } from '@/lib/sessions/session-requests-data'

/**
 * Real fetch()-backed SessionRequest store for admin oversight.
 * Approve/reject/complete are genuinely admin actions with no dependency
 * on a real "current user" — only the target request's own id — so this
 * surface is fully real. Creating a NEW request (requestSession/
 * startInstantSession in lib/sessions/use-session-requests.ts) stays on
 * the mock, since that write path needs a real learner identity that
 * doesn't exist yet (see PROGRESS.md's Phase 5 entry).
 */
let cache: SessionRequest[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadRequests(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/session-requests?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch session requests (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch session requests')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useSessionRequestsAdmin() {
  const [data, setData] = useState<SessionRequest[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadRequests()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load session requests'))
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

export async function refetchSessionRequestsAdmin(): Promise<void> {
  hasFetched = false
  await loadRequests()
}

async function patchSessionRequest(id: string, body: Record<string, unknown>): Promise<SessionRequest> {
  const res = await fetch(`/api/session-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update session request')
  await refetchSessionRequestsAdmin()
  return json.data
}

export function approveSessionAdmin(id: string, scheduledAt: string, notes?: string, lecturerId?: string) {
  return patchSessionRequest(id, { action: 'approve', scheduledAt, notes, lecturerId })
}
export function rejectSessionAdmin(id: string, notes: string) {
  return patchSessionRequest(id, { action: 'reject', notes })
}
export function completeSessionAdmin(id: string) {
  return patchSessionRequest(id, { action: 'complete' })
}
export function markSessionUnavailable(id: string) {
  return patchSessionRequest(id, { action: 'mark-unavailable' })
}
export function notifySessionParticipants(id: string) {
  return patchSessionRequest(id, { action: 'notify' })
}
