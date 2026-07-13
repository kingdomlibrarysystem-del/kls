'use client'

import { useSyncExternalStore } from 'react'

export interface SessionChatMessage {
  id: string
  sessionId: string
  senderName: string
  body: string
  sentAt: string
}

/**
 * Small in-memory chat store scoped to one mock session room. This is
 * intentionally NOT the full Slack-style channel/DM system from the
 * Phase 3 design doc — that's Phase 4's job (per-course channels, DM
 * threads, a shared Message type, /member/messages + /lecturer/messages
 * pages). Building that here would be half-implementing Phase 4 early.
 * This store exists only so the session room's embedded chat panel is
 * genuinely interactive today; Phase 4 can supersede it by pointing the
 * room at a real channel keyed by sessionId instead of this module.
 */
let messagesBySession: Record<string, SessionChatMessage[]> = {}
const listeners = new Set<() => void>()
const emptyMessages: SessionChatMessage[] = []

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshotFor(sessionId: string) {
  return messagesBySession[sessionId] ?? emptyMessages
}

/** Appends a chat message to this session's in-memory thread. */
export function sendSessionMessage(sessionId: string, senderName: string, body: string) {
  const existing = messagesBySession[sessionId] ?? []
  const created: SessionChatMessage = {
    id: `${sessionId}-${existing.length + 1}`,
    sessionId,
    senderName,
    body,
    sentAt: new Date().toISOString(),
  }
  messagesBySession = { ...messagesBySession, [sessionId]: [...existing, created] }
  emitChange()
  return created
}

/** Live-subscribes to one session's chat thread. */
export function useSessionChat(sessionId: string) {
  return useSyncExternalStore(subscribe, () => getSnapshotFor(sessionId), () => emptyMessages)
}
