'use client'

import { useEffect, useState } from 'react'
import type { RehabSession } from './rehab-data'

/** Real fetch()-backed admin-wide RehabSession store, mirrors use-borrowings-admin.ts. Split from intake admin per module's own line-count guidance. */
let cache: RehabSession[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadSchedule(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/rehabilitation/schedule?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch schedule (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch schedule')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useRehabScheduleAdmin() {
  const [data, setData] = useState<RehabSession[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadSchedule()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load schedule'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchRehabScheduleAdmin(): Promise<void> {
  hasFetched = false
  await loadSchedule()
}

export interface ScheduleSessionInput {
  userId: string
  groupId?: string
  facilitatorId?: string
  dateTime: string
  focus: string
}

export async function scheduleSession(input: ScheduleSessionInput) {
  const res = await fetch('/api/rehabilitation/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to schedule session')
  await refetchRehabScheduleAdmin()
  return json.data
}

async function patchSession(id: string, action: string): Promise<RehabSession> {
  const res = await fetch(`/api/rehabilitation/schedule/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update session')
  await refetchRehabScheduleAdmin()
  return json.data
}

export function completeSession(id: string) {
  return patchSession(id, 'complete')
}
export function markSessionMissed(id: string) {
  return patchSession(id, 'markMissed')
}
export function cancelSessionAdmin(id: string) {
  return patchSession(id, 'cancel')
}

export async function recordMilestone(userId: string, recordedById: string, title: string, description: string, sessionId?: string) {
  const res = await fetch('/api/rehabilitation/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, recordedById, title, description, sessionId }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to record milestone')
  return json.data
}
