'use client'

import { useEffect, useState } from 'react'
import type { BeautyAppointment } from './beauty-data'

/** Real fetch()-backed admin-wide BeautyAppointment store, mirrors use-borrowings-admin.ts (paginated, staff-only, no per-user keying). */
let cache: BeautyAppointment[] = []
let hasFetched = false
let fetchPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function loadAppointments(): Promise<void> {
  if (hasFetched) return Promise.resolve()
  if (fetchPromise) return fetchPromise
  fetchPromise = fetch('/api/beauty/appointments?pageSize=1000')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch beauty appointments (${res.status})`)
      return res.json()
    })
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message ?? 'Failed to fetch beauty appointments')
      cache = json.data
      hasFetched = true
      notify()
    })
    .finally(() => { fetchPromise = null })
  return fetchPromise
}

export function useBeautyAppointmentsAdmin() {
  const [data, setData] = useState<BeautyAppointment[]>(cache)
  const [loading, setLoading] = useState(!hasFetched)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const listener = () => setData([...cache])
    listeners.add(listener)
    if (!hasFetched) {
      loadAppointments()
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load beauty appointments'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => { listeners.delete(listener) }
  }, [])

  return { data, loading, error }
}

export async function refetchBeautyAppointmentsAdmin(): Promise<void> {
  hasFetched = false
  await loadAppointments()
}

async function patchAppointment(id: string, status: string): Promise<BeautyAppointment> {
  const res = await fetch(`/api/beauty/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to update appointment')
  await refetchBeautyAppointmentsAdmin()
  return json.data
}

export function confirmBeautyAppointment(id: string) {
  return patchAppointment(id, 'CONFIRMED')
}
export function completeBeautyAppointment(id: string) {
  return patchAppointment(id, 'COMPLETED')
}
export function cancelBeautyAppointmentAdmin(id: string) {
  return patchAppointment(id, 'CANCELLED')
}
