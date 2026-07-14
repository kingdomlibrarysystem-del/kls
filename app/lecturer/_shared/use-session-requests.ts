'use client'

import { useSyncExternalStore } from 'react'
import { mockSessionRequests, type SessionRequest, type SessionStatus } from './session-requests-data'
import { getEnrollmentsSnapshotForStore } from '@/app/member/_shared/use-enrollments'
import { courseCatalog } from '@/app/member/_shared/course-catalog-data'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'

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
 * Creates a new PENDING session request. Enforces the precondition the
 * lecturer-facing copy already promises ("session requests from learners
 * who complete your courses") as a real guard inside the function itself,
 * matching rejectSession()'s defense-in-depth pattern below — rather than
 * relying on the one current UI caller (completed-courses-section.tsx)
 * having already filtered to completed courses. Throws if the learner
 * hasn't completed courseId, or if lecturerName doesn't actually teach it.
 */
export function requestSession(input: RequestSessionInput): SessionRequest {
  const enrollment = getEnrollmentsSnapshotForStore().find((e) => e.courseId === input.courseId)
  if (!enrollment || enrollment.status !== 'COMPLETED') {
    throw new Error('You can only request a session for a course you have completed.')
  }

  const course = courseCatalog.find((c) => c.id === input.courseId)
  const lecturer = course ? lecturerRoster.find((l) => l.id === course.lecturerId) : undefined
  if (!lecturer || lecturer.name !== input.lecturerName) {
    throw new Error('This lecturer does not teach the requested course.')
  }

  const created: SessionRequest = {
    id: nextId(),
    requestedAt: new Date().toISOString().slice(0, 10),
    status: 'PENDING',
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
