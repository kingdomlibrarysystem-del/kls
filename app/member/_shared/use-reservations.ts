'use client'

import { useSyncExternalStore } from 'react'
import { mockReservations as initialReservations, type Reservation } from '../reservations/_components/reservations-data'

/**
 * Module-level mutable store so a Reserve made from the public library
 * (`/library/[id]`) is immediately visible on `/member/reservations`,
 * without a backend. Mirrors the use-enrollments.ts pattern from Phase 17.
 */
let reservations: Reservation[] = [...initialReservations]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return reservations
}

function nextId() {
  return reservations.reduce((max, r) => Math.max(max, r.id), 0) + 1
}

/** Adds a new waiting reservation (e.g. from a public-library Reserve action), placed at the back of the queue. */
export function addReservation(title: string, author: string): Reservation {
  const queueAhead = reservations.filter((r) => r.title === title && r.status === 'Waiting').length
  const created: Reservation = {
    id: nextId(),
    title,
    author,
    reserved: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    status: 'Waiting',
    queue: queueAhead + 1,
  }
  reservations = [created, ...reservations]
  emitChange()
  return created
}

/** Live-subscribes to the shared reservations store. */
export function useReservations() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialReservations)
}
