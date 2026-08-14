'use client'

import { useEffect, useState } from 'react'
import type { Reservation } from './reservations-data'

/**
 * Real fetch()-backed store for the admin Reservations Management page,
 * replacing page.tsx's old `useState<Reservation[]>(initialData)`. Same
 * module-level cache + listener Set + in-flight-promise-dedup pattern
 * established in Phase 2.
 */
let cache: Reservation[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadReservations(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/reservations?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch reservations (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch reservations')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useReservationsAdmin() {
  const [data, setData] = useState<Reservation[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadReservations()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load reservations'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return { data, loading, error }
}

export async function refetchReservationsAdmin(): Promise<void> {
  hasFetched = false
  await loadReservations()
}

async function patchReservation(id: string, body: Record<string, unknown>): Promise<Reservation> {
  const res = await fetch(`/api/reservations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update reservation')
  await refetchReservationsAdmin()
  return json.data
}

export function notifyReservation(id: string) {
  return patchReservation(id, { action: 'notify' })
}
export function convertReservationToBorrow(id: string) {
  return patchReservation(id, { action: 'convertToBorrow' })
}
export function cancelReservation(id: string) {
  return patchReservation(id, { action: 'cancel' })
}
export function expireReservation(id: string) {
  return patchReservation(id, { action: 'expire' })
}
