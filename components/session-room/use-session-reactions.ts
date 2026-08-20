'use client'

import { useSyncExternalStore } from 'react'

export interface SessionReaction {
  id: string
  emoji: string
  senderName: string
}

/**
 * Small in-memory reaction-burst store scoped to one mock session room —
 * same useSyncExternalStore pattern as every other store in this app
 * (use-session-chat.ts, use-enrollments.ts). Chat messages
 * (session-chat-panel.tsx/use-session-chat.ts) have no react-to-message
 * feature to reuse — this is a distinct, ambient "send a floating emoji
 * over the video grid" action, not a per-message reaction, so it gets its
 * own tiny store rather than bolting an unrelated shape onto chat.
 * Reactions are transient by nature (Meet's burst disappears after a
 * couple seconds) — the store only needs to hold the most recent one per
 * render tick; consumers are responsible for clearing it after their own
 * animation window via `clearReaction`.
 */
let activeReaction: SessionReaction | null = null
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return activeReaction
}

/** Sends a quick reaction into the room — replaces whatever reaction is currently showing. Returns the created reaction so the caller can also broadcast its exact id (e.g. over LiveKit's data channel) without generating a second, mismatched id. */
export function sendSessionReaction(sessionId: string, senderName: string, emoji: string): SessionReaction {
  const reaction: SessionReaction = { id: `${sessionId}-${Date.now()}`, emoji, senderName }
  activeReaction = reaction
  emitChange()
  return reaction
}

/** Renders a reaction that arrived over LiveKit's real-time data channel from another participant — same store, so it uses the exact same ReactionBurst UI as a locally-sent one. */
export function receiveSessionReaction(id: string, emoji: string, senderName: string) {
  activeReaction = { id, emoji, senderName }
  emitChange()
}

/** Clears the currently-showing reaction (called by the consumer once its burst animation finishes). */
export function clearSessionReaction() {
  activeReaction = null
  emitChange()
}

/** Live-subscribes to the room's current reaction burst, or null if none is showing. */
export function useSessionReaction() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
