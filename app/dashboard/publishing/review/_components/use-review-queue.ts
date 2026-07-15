'use client'

import { useSyncExternalStore } from 'react'
import { mockSubmissions, type PublicationSubmission, type PublicationStatus } from './review-data'

/**
 * Module-level mutable store — the SINGLE source of truth for every
 * publication submission, read by both the admin Review Queue
 * (`/dashboard/publishing/review`) and the contributor's My Submissions
 * page (`/contributor/publishing`, via a thin re-export in
 * `use-my-submissions.ts`).
 *
 * Previously these were two separate, disconnected stores that only
 * looked linked because of coincidentally-matching seed IDs (e.g. both
 * had a `pub-001`) — an admin approval in the old Review Queue called
 * `removeSubmissionFromQueue()`, which only mutated the admin-side array;
 * the contributor's own `mySubmissions` array never moved, so their "My
 * Submissions" list would show a title stuck at SUBMITTED forever even
 * after it was genuinely approved/rejected/published elsewhere. Merging
 * onto one store fixes that regardless of whether portal consolidation
 * ever happens — it was a real correctness bug, not just consolidation
 * prep.
 */
let submissions: PublicationSubmission[] = [...mockSubmissions]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return submissions
}

/** Appends a new submission — called by Submit a Book's Save Draft / Submit for Review actions. */
export function addSubmission(entry: { title: string; contributor: string; category: string; language: PublicationSubmission['language']; coverImage: string; description: string; status: PublicationStatus }) {
  const created: PublicationSubmission = {
    ...entry,
    id: `pub-${Date.now()}`,
    submittedAt: new Date().toISOString().slice(0, 10),
  }
  submissions = [created, ...submissions]
  emitChange()
  return created
}

/** Sets a submission's status in place — used by both the admin Approve/Reject decision and the contributor's Withdraw action (which removes it instead, see removeSubmission). */
export function setSubmissionStatus(id: string, status: PublicationStatus) {
  submissions = submissions.map((s) => (s.id === id ? { ...s, status } : s))
  emitChange()
}

/** Removes a submission entirely — used for Withdraw (contributor-initiated, DRAFT/SUBMITTED only). */
export function removeSubmission(id: string) {
  submissions = submissions.filter((s) => s.id !== id)
  emitChange()
}

/** Live-subscribes to the shared submissions store. */
export function useReviewQueue() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mockSubmissions)
}
