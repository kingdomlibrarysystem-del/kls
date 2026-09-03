'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface PresenceRow {
  id: string
  sessionRequestId: string
  userId?: string
  displayName: string
  role: 'learner' | 'lecturer' | 'admin'
  joinedAt: string
  lastSeenAt: string
  present: boolean
}

const HEARTBEAT_INTERVAL_MS = 15_000
/** How often the roster itself is refetched, so a removal/other join shows up without a full page reload. */
const ROSTER_POLL_MS = 8_000

interface UseSessionPresenceInput {
  sessionRequestId: string
  userId?: string
  displayName: string
}

/**
 * Real join/presence tracking for a session room — replaces the previous
 * decorative "other participant is always shown as connected" behavior.
 * Joins on mount (POST), heartbeats on an interval (PATCH) so the row
 * doesn't age into "stale" while the tab stays open, and leaves (DELETE)
 * on unmount or an explicit call. Also polls the room's full roster so a
 * host can see real-time who has actually joined and remove someone who
 * has (kick), distinct from someone merely invited who never opened the
 * room at all. The room role (learner/lecturer/admin) is resolved
 * server-side from the caller's real session, not passed here — see
 * resolvePresenceRole in app/api/session-requests/[id]/presence/route.ts.
 */
export function useSessionPresence({ sessionRequestId, userId, displayName }: UseSessionPresenceInput) {
  const [roster, setRoster] = useState<PresenceRow[]>([])
  const presenceIdRef = useRef<string | null>(null)
  const leftRef = useRef(false)

  const refetchRoster = useCallback(async () => {
    const res = await fetch(`/api/session-requests/${sessionRequestId}/presence`)
    const json = await res.json().catch(() => null)
    if (json?.code === 'success') setRoster(json.data ?? [])
  }, [sessionRequestId])

  useEffect(() => {
    leftRef.current = false
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined

    fetch(`/api/session-requests/${sessionRequestId}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, displayName }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || leftRef.current) return
        presenceIdRef.current = json.data.id
        heartbeatTimer = setInterval(() => {
          if (presenceIdRef.current) {
            fetch(`/api/session-requests/${sessionRequestId}/presence`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ presenceId: presenceIdRef.current }),
            }).catch(() => {})
          }
        }, HEARTBEAT_INTERVAL_MS)
      })
      .catch(() => {})

    Promise.resolve().then(refetchRoster)
    const rosterTimer = setInterval(refetchRoster, ROSTER_POLL_MS)

    return () => {
      leftRef.current = true
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      if (rosterTimer) clearInterval(rosterTimer)
      if (presenceIdRef.current) {
        // Real leave on unmount (navigating away, closing the tab via beforeunload isn't reachable here, but a clean SPA navigation is) — best-effort, not awaited.
        fetch(`/api/session-requests/${sessionRequestId}/presence?presenceId=${presenceIdRef.current}`, { method: 'DELETE' }).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRequestId])

  const leaveNow = useCallback(() => {
    if (presenceIdRef.current) {
      fetch(`/api/session-requests/${sessionRequestId}/presence?presenceId=${presenceIdRef.current}`, { method: 'DELETE' }).catch(() => {})
      presenceIdRef.current = null
    }
  }, [sessionRequestId])

  /** Host-only: removes someone who IS actually present right now — a real state change, not decorative, since presence is real data. */
  const removeParticipant = useCallback(async (presenceId: string) => {
    await fetch(`/api/session-requests/${sessionRequestId}/presence?presenceId=${presenceId}`, { method: 'DELETE' })
    await refetchRoster()
  }, [sessionRequestId, refetchRoster])

  return { roster, leaveNow, removeParticipant }
}
