'use client'

import { useEffect, useState } from 'react'
import type { Counselor, CounselingSession, CounselingSessionStatus, CounselingSessionMode, CounselingNote, CounselingConsent } from './counseling-data'

/** Real Counseling hooks, backed by /api/counseling/* — same module-level cache/listener + optimistic-mutation pattern as use-health.ts/use-beauty.ts. */

let counselorsCache: Counselor[] | null = null
let counselorsFetchPromise: Promise<void> | null = null
const counselorsListeners = new Set<() => void>()

function loadCounselors(): Promise<void> {
  if (counselorsCache) return Promise.resolve()
  if (counselorsFetchPromise) return counselorsFetchPromise
  counselorsFetchPromise = fetch('/api/counseling/counselors')
    .then((res) => res.json())
    .then((json) => {
      counselorsCache = json.data ?? []
      counselorsListeners.forEach((l) => l())
    })
    .catch(() => { counselorsCache = [] })
    .finally(() => { counselorsFetchPromise = null })
  return counselorsFetchPromise
}

export function useCounselors() {
  const [data, setData] = useState<Counselor[]>(counselorsCache ?? [])
  const [loading, setLoading] = useState(!counselorsCache)

  useEffect(() => {
    const listener = () => setData(counselorsCache ?? [])
    counselorsListeners.add(listener)
    if (!counselorsCache) loadCounselors().finally(() => setLoading(false))
    else setLoading(false)
    return () => { counselorsListeners.delete(listener) }
  }, [])

  return { data, loading }
}

let sessions: CounselingSession[] = []
let loadedForUserId: string | null = null
const sessionListeners = new Set<() => void>()

function emitSessionsChange() {
  sessionListeners.forEach((l) => l())
}

async function loadSessions(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/counseling/sessions?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return
  sessions = json.data ?? []
  emitSessionsChange()
}

export interface RequestSessionInput {
  counselorId: string
  proposedTime: string
  mode: CounselingSessionMode
  reason: string
}

/** Requests a new PENDING counseling session for the signed-in member. Optimistic. */
export function requestCounselingSession(userId: string, input: RequestSessionInput) {
  const tempId = `pending-${Date.now()}`
  const optimistic: CounselingSession = { id: tempId, status: 'PENDING', ...input }
  sessions = [optimistic, ...sessions]
  emitSessionsChange()

  fetch('/api/counseling/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...input }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message)
      sessions = sessions.map((s) => (s.id === tempId ? json.data : s))
      emitSessionsChange()
    })
    .catch(() => {
      sessions = sessions.filter((s) => s.id !== tempId)
      emitSessionsChange()
    })
}

/** Cancels a PENDING or CONFIRMED session. Optimistic. */
export function cancelCounselingSession(id: string) {
  const before = sessions
  sessions = sessions.map((s) => (s.id === id ? { ...s, status: 'CANCELLED' as CounselingSessionStatus } : s))
  emitSessionsChange()

  fetch(`/api/counseling/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELLED' }),
  }).catch(() => {
    sessions = before
    emitSessionsChange()
  })
}

export function useCounselingSessions(userId: string | undefined) {
  const [data, setData] = useState<CounselingSession[]>(sessions)

  useEffect(() => {
    const listener = () => setData(sessions)
    sessionListeners.add(listener)
    if (userId && loadedForUserId !== userId) loadSessions(userId)
    return () => { sessionListeners.delete(listener) }
  }, [userId])

  return data
}

/** Read-only, per-user session notes — mirrors useHealthRecords. */
export function useCounselingNotes(userId: string | undefined) {
  const [data, setData] = useState<CounselingNote[]>([])

  useEffect(() => {
    if (!userId) { setData([]); return }
    fetch(`/api/counseling/notes?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
  }, [userId])

  return data
}

export function useCounselingConsent(userId: string | undefined) {
  const [data, setData] = useState<CounselingConsent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetch(`/api/counseling/consent?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [userId])

  return { data, loading }
}

export async function updateCounselingConsent(userId: string, patch: Partial<Omit<CounselingConsent, 'userId'>>) {
  const res = await fetch('/api/counseling/consent', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...patch }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update consent')
  return json.data
}
