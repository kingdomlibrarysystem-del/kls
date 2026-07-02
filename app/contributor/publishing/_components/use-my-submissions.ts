'use client'

import { useSyncExternalStore } from 'react'
import { mySubmissions, type MySubmission, type PublicationStatus } from './my-submissions-data'

/**
 * Module-level mutable store so Submit a Book
 * (`/contributor/publishing/submit`) can append a new submission and My
 * Submissions reflects it immediately, without a backend. Cross-route like
 * the admin stores from Batches 2–4, since submit and list live on
 * different pages here.
 */
let submissions: MySubmission[] = [...mySubmissions]
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

export function addMySubmission(entry: { title: string; category: string; status: PublicationStatus }) {
  const created: MySubmission = {
    ...entry,
    id: `pub-${Date.now()}`,
    submittedAt: new Date().toISOString().slice(0, 10),
  }
  submissions = [created, ...submissions]
  emitChange()
  return created
}

export function removeMySubmission(id: string) {
  submissions = submissions.filter((s) => s.id !== id)
  emitChange()
}

/** Live-subscribes to the shared My Submissions store. */
export function useMySubmissions() {
  return useSyncExternalStore(subscribe, getSnapshot, () => mySubmissions)
}
