'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { SessionRequest } from './session-requests-data'

export type { SessionRequest }

/** Fetches the signed-in member's own session requests from the real /api/session-requests, filtered by their session learnerId. */
export function useSessionRequests() {
  const { user } = useAuth()
  const [data, setData] = useState<SessionRequest[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) { setData([]); return }
    const res = await fetch(`/api/session-requests?learnerId=${user.id}&pageSize=1000`)
    const json = await res.json()
    setData(json.data ?? [])
  }, [user])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
  }, [refetch])

  return { data, loading, refetch }
}

export interface RequestSessionInput {
  learnerId: string
  lecturerId: string
  courseId: string
  proposedTime: string
  notes?: string
}

/** Creates a new PENDING session request via a real POST /api/session-requests. */
export async function requestSession(input: RequestSessionInput): Promise<SessionRequest> {
  const res = await fetch('/api/session-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, mode: 'SCHEDULED' }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not submit this request')
  return json.data
}

export interface StartInstantSessionInput {
  learnerId: string
  lecturerId: string
  courseId: string
}

/** Starts an INSTANT session — created directly as APPROVED via the real API, matching the "start now" flow. */
export async function startInstantSession(input: StartInstantSessionInput): Promise<SessionRequest> {
  const res = await fetch('/api/session-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, mode: 'INSTANT', proposedTime: new Date().toISOString() }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not start this session')
  return json.data
}

/** Fetches one session request by id directly — used by the session room, which is reachable by either party (learner or admin observer) regardless of whose "own list" it would otherwise appear in. */
export async function fetchSessionRequestById(id: string): Promise<SessionRequest | undefined> {
  const res = await fetch(`/api/session-requests/${id}`)
  if (!res.ok) return undefined
  const json = await res.json()
  if (json.code !== 'success' || !json.data) return undefined
  return json.data
}

/** Marks an APPROVED session COMPLETED via the real API — called when the admin ends the mock session room. */
export async function completeSession(id: string): Promise<SessionRequest> {
  const res = await fetch(`/api/session-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'complete' }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not complete this session')
  return json.data
}
