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

/** Appends a real activity entry to this session's feed, trimming to the most recent MAX_ENTRIES. */
export function logActivity(sessionId: string, kind: ActivityKind, actorName: string, detail?: string): ActivityEntry {
  const existing = entriesBySession[sessionId] ?? []
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
