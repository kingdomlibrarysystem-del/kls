'use client'

import { useSyncExternalStore } from 'react'

export type ActivityKind = 'joined' | 'left' | 'hand-raised' | 'hand-lowered' | 'presenting-started' | 'presenting-stopped' | 'reacted'

export interface ActivityEntry {
  id: string
  kind: ActivityKind
  actorName: string
  detail?: string
  at: string
}

const MAX_ENTRIES = 50

/**
 * Real in-room activity feed — one shared list per session, same
 * useSyncExternalStore pattern as use-session-chat.ts/
 * use-session-reactions.ts. Fed by genuine events (LiveKit
 * ParticipantConnected/Disconnected, real hand-raise/presenting state
 * changes, reactions), not decorative — this is what makes "who did
 * what, when" visible in the room instead of only the current
 * snapshot state.
 */
let entriesBySession: Record<string, ActivityEntry[]> = {}
const listeners = new Set<() => void>()
const emptyEntries: ActivityEntry[] = []

/**
 * Tracks who's already logged as "joined" (or "left" since) per session,
 * so the two independent triggers that can each call logActivity('joined',
 * ...) for the same person — the local liveKitReady effect and LiveKit's
 * own ParticipantConnected event, either of which can fire more than once
 * across a reconnect — don't produce duplicate entries. Keyed by
 * `${sessionId}:${actorName}` since that's the only identity available at
 * either call site (LiveKit's RemoteParticipant only exposes name/identity,
 * not a stable app-level userId here).
 */
const joinedActors = new Set<string>()

function emitChange() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshotFor(sessionId: string) {
  return entriesBySession[sessionId] ?? emptyEntries
}

/**
 * Appends a real activity entry to this session's feed, trimming to the
 * most recent MAX_ENTRIES. For 'joined'/'left', dedupes against the same
 * actor already being in that state (see `joinedActors` above) — returns
 * the existing entry instead of logging a redundant one when a caller
 * fires a duplicate join/leave for someone whose state hasn't changed.
 */
export function logActivity(sessionId: string, kind: ActivityKind, actorName: string, detail?: string): ActivityEntry {
  const existing = entriesBySession[sessionId] ?? []
  const actorKey = `${sessionId}:${actorName}`
  if (kind === 'joined') {
    if (joinedActors.has(actorKey)) {
      const last = [...existing].reverse().find((e) => e.actorName === actorName && (e.kind === 'joined' || e.kind === 'left'))
      if (last) return last
    }
    joinedActors.add(actorKey)
  } else if (kind === 'left') {
    joinedActors.delete(actorKey)
  }
  const entry: ActivityEntry = { id: `${sessionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, actorName, detail, at: new Date().toISOString() }
  entriesBySession = { ...entriesBySession, [sessionId]: [...existing, entry].slice(-MAX_ENTRIES) }
  emitChange()
  return entry
}

/** Records an activity entry that arrived over LiveKit's data channel from another participant — dedupes by id so a redundant delivery doesn't double-log. */
export function receiveActivity(sessionId: string, entry: ActivityEntry) {
  const existing = entriesBySession[sessionId] ?? []
  if (existing.some((e) => e.id === entry.id)) return
  entriesBySession = { ...entriesBySession, [sessionId]: [...existing, entry].slice(-MAX_ENTRIES) }
  emitChange()
}

/** Live-subscribes to one session's activity feed. */
export function useSessionActivity(sessionId: string) {
  return useSyncExternalStore(subscribe, () => getSnapshotFor(sessionId), () => emptyEntries)
}
