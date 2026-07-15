'use client'

import { useSyncExternalStore } from 'react'
import { mockSessionRequests, type SessionRequest, type SessionStatus } from './session-requests-data'

/**
 * Module-level mutable store for live-session booking requests —
 * mirrors the exact pattern used by use-review-queue.ts/use-audit-log.ts.
 * Read by three roles: the learner (My Sessions), the lecturer (Session
 * Requests queue + My Sessions), and the admin (read-only oversight at
 * /dashboard/e-learning/sessions) — living under app/lecturer/_shared
 * follows the same precedent as use-enrollments.ts (owned by one role's
 * folder, imported freely across roles that need to read it).
 */
let requests: SessionRequest[] = [...mockSessionRequests]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return requests
}

function nextId() {
  const max = requests.reduce((m, r) => {
    const n = Number(r.id.replace('sess-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `sess-${String(max + 1).padStart(3, '0')}`
}

export interface RequestSessionInput {
  learnerName: string
  lecturerName: string
  courseId: string
  courseTitle: string
  proposedTime: string
  notes?: string
}

/**
 * Creates a new PENDING session request. Per product decision, session
 * requests work like a "Slack huddle" — any authenticated member can
 * request a live session with any lecturer, for any course, at any time,
 * with no enrollment/completion/lecturer-match precondition. (Reverses
 * the enforcement added in 354306a.)
 */
export function requestSession(input: RequestSessionInput): SessionRequest {
  const created: SessionRequest = {
    id: nextId(),
    requestedAt: new Date().toISOString().slice(0, 10),
    status: 'PENDING',
    mode: 'SCHEDULED',
    ...input,
  }
  requests = [created, ...requests]
  emitChange()
  return created
}

export interface StartInstantSessionInput {
  learnerName: string
  lecturerName: string
  courseId: string
  courseTitle: string
}

/**
 * Starts an INSTANT session — the Meet-style "start now" flow. Created
 * directly as APPROVED (no PENDING stage, nothing for either party to
 * approve) with scheduledAt stamped to the moment of creation, so
 * SessionCard's countdown gate treats it as already startable. Either
 * party can initiate one; both land in the same real session-room route
 * requestSession()'s scheduled flow already uses.
 */
export function startInstantSession(input: StartInstantSessionInput): SessionRequest {
  const now = new Date().toISOString()
  const created: SessionRequest = {
    id: nextId(),
    requestedAt: now.slice(0, 10),
    proposedTime: now,
    status: 'APPROVED',
    mode: 'INSTANT',
    scheduledAt: now,
    ...input,
  }
  requests = [created, ...requests]
  emitChange()
  return created
}

/** Approves a PENDING request, setting the real scheduled start time. */
export function approveSession(id: string, scheduledAt: string, notes?: string) {
  requests = requests.map((r) => (r.id === id ? { ...r, status: 'APPROVED' as SessionStatus, scheduledAt, notes } : r))
  emitChange()
}

/** Rejects a PENDING request — a reason is required, matching the publishing-review Reject pattern. */
export function rejectSession(id: string, notes: string) {
  if (!notes.trim()) throw new Error('Rejecting a session request requires a reason in the notes field')
  requests = requests.map((r) => (r.id === id ? { ...r, status: 'REJECTED' as SessionStatus, notes } : r))
  emitChange()
}

/** Marks an APPROVED session COMPLETED — called when the lecturer ends the mock session room. */
export function completeSession(id: string) {
  requests = requests.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' as SessionStatus } : r))
  emitChange()
}

/** Live-subscribes to the shared session-request list. */
export function useSessionRequests() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockSessionRequests)
}
