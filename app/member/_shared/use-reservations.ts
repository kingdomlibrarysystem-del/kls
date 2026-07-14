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

/** Adds a new reservation (e.g. from a public-library Reserve action). Ready immediately if no one else is waiting for this title, otherwise placed at the back of the queue. */
export function addReservation(title: string, author: string): Reservation {
  const queueAhead = reservations.filter((r) => r.title === title && (r.status === 'Waiting' || r.status === 'Ready')).length
  const created: Reservation = {
    id: nextId(),
    title,
    author,
    reserved: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    status: queueAhead === 0 ? 'Ready' : 'Waiting',
    queue: queueAhead,
  }
  reservations = [created, ...reservations]
  emitChange()
  return created
}

/**
 * Marks a reservation Fulfilled — used when a Ready reservation is converted
 * into a real borrowing. This frees up the copy that reservation held, so
 * every other Waiting reservation for the same title moves up one place;
 * whichever one reaches the front (queue 0) is promoted to Ready — this is
 * the only place a reservation can transition out of Waiting.
 */
export function fulfillReservation(id: number) {
  const target = reservations.find((r) => r.id === id)
  reservations = reservations.map((r) => {
    if (r.id === id) {
      return { ...r, status: 'Fulfilled', fulfilled: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) }
    }
    if (target && r.title === target.title && r.status === 'Waiting') {
      const queue = (r.queue ?? 1) - 1
      return { ...r, queue, status: queue === 0 ? 'Ready' : 'Waiting' }
    }
    return r
  })
  emitChange()
}

/** Live-subscribes to the shared reservations store. */
export function useReservations() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialReservations)
}
