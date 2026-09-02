'use client'

import { useEffect, useState } from 'react'
import type { BeautyProvider, BeautyService, BeautyAppointment, BeautyAppointmentStatus, BeautyReview } from './beauty-data'

/** Real Beauty Services hooks, backed by /api/beauty/* — same module-level cache/listener + optimistic-mutation pattern as use-health.ts. */

let providersCache: BeautyProvider[] | null = null
let providersFetchPromise: Promise<void> | null = null
const providersListeners = new Set<() => void>()

function loadProviders(): Promise<void> {
  if (providersCache) return Promise.resolve()
  if (providersFetchPromise) return providersFetchPromise
  providersFetchPromise = fetch('/api/beauty/providers')
    .then((res) => res.json())
    .then((json) => {
      providersCache = json.data ?? []
      providersListeners.forEach((l) => l())
    })
    .catch(() => { providersCache = [] })
    .finally(() => { providersFetchPromise = null })
  return providersFetchPromise
}

export function useBeautyProviders() {
  const [data, setData] = useState<BeautyProvider[]>(providersCache ?? [])
  const [loading, setLoading] = useState(!providersCache)

  useEffect(() => {
    const listener = () => setData(providersCache ?? [])
    providersListeners.add(listener)
    if (!providersCache) loadProviders().finally(() => setLoading(false))
    else setLoading(false)
    return () => { providersListeners.delete(listener) }
  }, [])

  return { data, loading }
}

let servicesCache: Record<string, BeautyService[]> = {}
const servicesListeners = new Set<() => void>()

function loadServices(providerId: string): Promise<void> {
  const key = providerId || 'all'
  return fetch(`/api/beauty/services${providerId ? `?providerId=${providerId}` : ''}`)
    .then((res) => res.json())
    .then((json) => {
      servicesCache = { ...servicesCache, [key]: json.data ?? [] }
      servicesListeners.forEach((l) => l())
    })
    .catch(() => {
      servicesCache = { ...servicesCache, [key]: [] }
    })
}

export function useBeautyServices(providerId?: string) {
  const key = providerId || 'all'
  const [data, setData] = useState<BeautyService[]>(servicesCache[key] ?? [])
  const [loading, setLoading] = useState(!servicesCache[key])

  useEffect(() => {
    const listener = () => setData(servicesCache[key] ?? [])
    servicesListeners.add(listener)
    if (!servicesCache[key]) loadServices(providerId ?? '').finally(() => setLoading(false))
    else setLoading(false)
    return () => { servicesListeners.delete(listener) }
  }, [key, providerId])

  return { data, loading }
}

let appointments: BeautyAppointment[] = []
let loadedForUserId: string | null = null
const appointmentListeners = new Set<() => void>()

function emitAppointmentsChange() {
  appointmentListeners.forEach((l) => l())
}

async function loadAppointments(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/beauty/appointments?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return
  appointments = json.data ?? []
  emitAppointmentsChange()
}

export interface BookBeautyAppointmentInput {
  providerId: string
  serviceId: string
  dateTime: string
  notes?: string
}

/** Books a new PENDING beauty appointment for the signed-in member. Optimistic. */
export function bookBeautyAppointment(userId: string, input: BookBeautyAppointmentInput) {
  const tempId = `pending-${Date.now()}`
  const optimistic: BeautyAppointment = { id: tempId, status: 'PENDING', ...input }
  appointments = [optimistic, ...appointments]
  emitAppointmentsChange()

  fetch('/api/beauty/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...input }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json.code !== 'success') throw new Error(json.message)
      appointments = appointments.map((a) => (a.id === tempId ? json.data : a))
      emitAppointmentsChange()
    })
    .catch(() => {
      appointments = appointments.filter((a) => a.id !== tempId)
      emitAppointmentsChange()
    })
}

/** Cancels a PENDING or CONFIRMED appointment. Optimistic. */
export function cancelBeautyAppointment(id: string) {
  const before = appointments
  appointments = appointments.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' as BeautyAppointmentStatus } : a))
  emitAppointmentsChange()

  fetch(`/api/beauty/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELLED' }),
  }).catch(() => {
    appointments = before
    emitAppointmentsChange()
  })
}

export function useBeautyAppointments(userId: string | undefined) {
  const [data, setData] = useState<BeautyAppointment[]>(appointments)

  useEffect(() => {
    const listener = () => setData(appointments)
    appointmentListeners.add(listener)
    if (userId && loadedForUserId !== userId) loadAppointments(userId)
    return () => { appointmentListeners.delete(listener) }
  }, [userId])

  return data
}

export function useBeautyReviews(providerId: string | undefined) {
  const [data, setData] = useState<BeautyReview[]>([])

  useEffect(() => {
    if (!providerId) { setData([]); return }
    fetch(`/api/beauty/reviews?providerId=${providerId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
  }, [providerId])

  return data
}

export async function submitBeautyReview(userId: string, appointmentId: string, rating: number, comment?: string) {
  const res = await fetch('/api/beauty/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, appointmentId, rating, comment }),
  })
  const json = await res.json()
  if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Failed to submit review')
  return json.data
}
