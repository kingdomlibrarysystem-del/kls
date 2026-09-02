'use client'

import { useEffect, useState } from 'react'
import type { Appointment } from '../../_shared/health-data'

/**
 * Real fetch()-backed Appointment store for admin oversight — separate
 * from the member-scoped use-health.ts store (which caches per-userId and
 * is optimistic), since this one is a single admin-wide, paginated list
 * with no per-user keying, same split use-session-requests-admin.ts
 * already establishes for Sessions.
 */
let cache: Appointment[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadAppointments(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/appointments?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch appointments (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch appointments')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => {
      fetchPromise = null
    })
  return fetchPromise
}

export function useAppointmentsAdmin() {
  const [data, setData] = useState<Appointment[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadAppointments()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load appointments'))
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

export async function refetchAppointmentsAdmin(): Promise<void> {
  hasFetched = false
  await loadAppointments()
}

async function patchAppointment(id: string, status: string): Promise<Appointment> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update appointment')
  await refetchAppointmentsAdmin()
  return json.data
}

export function confirmAppointmentAdmin(id: string) {
  return patchAppointment(id, 'CONFIRMED')
}
export function completeAppointmentAdmin(id: string) {
  return patchAppointment(id, 'COMPLETED')
}
export function cancelAppointmentAdmin(id: string) {
  return patchAppointment(id, 'CANCELLED')
}
