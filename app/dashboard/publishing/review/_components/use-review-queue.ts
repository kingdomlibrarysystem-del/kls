'use client'

import { useSyncExternalStore } from 'react'
import { mockSubmissions, type PublicationSubmission } from './review-data'

/**
 * Module-level mutable store so an Approve/Reject decision in the Review
 * Queue survives a reload — mirrors the pattern already used by
 * use-revenue.ts and every other CRUD-ish page in this app. Previously
 * `ReviewQueueView` seeded a local `useState` copy from `mockSubmissions`
 * on mount and only ever mutated that local copy, so a decision was lost
 * the moment the component remounted (e.g. a page refresh).
 */
let queue: PublicationSubmission[] = [...mockSubmissions]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return queue
}

/** Removes a submission from the queue — called once a manager approves or rejects it. */
export function removeSubmissionFromQueue(id: string) {
  queue = queue.filter((s) => s.id !== id)
  emitChange()
}

/** Live-subscribes to the shared review queue. */
export function useReviewQueue() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockSubmissions)
}
