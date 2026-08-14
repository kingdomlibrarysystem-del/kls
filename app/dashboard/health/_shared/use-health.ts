'use client'

import { useEffect, useState } from 'react'
import type { Clinic, Appointment, AppointmentStatus, HealthRecordEntry, ImmunizationEntry } from './health-data'

/**
 * Real Health System hooks, backed by /api/clinics, /api/appointments,
 * /api/health-records, /api/immunizations — replacing health-data.ts's
 * hardcoded 'John Doe' persona (which never matched a real signed-in
 * user). Records/immunizations stay read-only (per the mock's own
 * design note — no clinic-practitioner authoring UI exists).
 */

let clinicsCache: Clinic[] | null = null
let clinicsFetchPromise: Promise<void> | null = null
const clinicsListeners = new Set<() => void>()

function loadClinics(): Promise<void> {
  if (clinicsCache) return Promise.resolve()
  if (clinicsFetchPromise) return clinicsFetchPromise
  clinicsFetchPromise = fetch('/api/clinics')
    .then((res) => res.json())
    .then((json) => {
      clinicsCache = json.data ?? []
      clinicsListeners.forEach((l) => l())
    })
    .catch(() => {
      clinicsCache = []
    })
    .finally(() => {
      clinicsFetchPromise = null
    })
  return clinicsFetchPromise
}

/** Live directory of partnered clinics — admin reference data, no per-user scoping. */
export function useClinics() {
  const [data, setData] = useState<Clinic[]>(clinicsCache ?? [])
  const [loading, setLoading] = useState(!clinicsCache)

  useEffect(() => {
    const listener = () => setData(clinicsCache ?? [])
    clinicsListeners.add(listener)
    if (!clinicsCache) {
      loadClinics().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      clinicsListeners.delete(listener)
    }
  }, [])

  return { data, loading }
}

let appointments: Appointment[] = []
let loadedForUserId: string | null = null
const appointmentListeners = new Set<() => void>()

function emitAppointmentsChange() {
  appointmentListeners.forEach((l) => l())
}

async function loadAppointments(userId: string) {
  loadedForUserId = userId
  const res = await fetch(`/api/appointments?userId=${userId}`)
  const json = await res.json()
  if (loadedForUserId !== userId) return
  appointments = json.data ?? []
  emitAppointmentsChange()
}

export interface BookAppointmentInput {
  clinicId: string
  dateTime: string
  reason: string
}

/** Books a new PENDING checkup appointment for the signed-in member. Optimistic. */
export function bookAppointment(userId: string, input: BookAppointmentInput) {
  const tempId = `pending-${Date.now()}`
  const optimistic: Appointment = { id: tempId, status: 'PENDING', ...input }
  appointments = [optimistic, ...appointments]
  emitAppointmentsChange()

  fetch('/api/appointments', {
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
export function cancelAppointment(id: string) {
  const before = appointments
  appointments = appointments.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' as AppointmentStatus } : a))
  emitAppointmentsChange()

  fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CANCELLED' }),
  }).catch(() => {
    appointments = before
    emitAppointmentsChange()
  })
}

/** Live-subscribes to the signed-in member's own appointments. */
export function useAppointments(userId: string | undefined) {
  const [data, setData] = useState<Appointment[]>(appointments)

  useEffect(() => {
    const listener = () => setData(appointments)
    appointmentListeners.add(listener)
    if (userId && loadedForUserId !== userId) loadAppointments(userId)
    return () => {
      appointmentListeners.delete(listener)
    }
  }, [userId])

  return data
}

/**
 * Health records and immunizations have no write flow (they'd be
 * entered by a clinic/practitioner, not the member) — plain fetch hooks
 * scoped to the signed-in user.
 */
export function useHealthRecords(userId: string | undefined) {
  const [data, setData] = useState<HealthRecordEntry[]>([])

  useEffect(() => {
    if (!userId) { setData([]); return }
    fetch(`/api/health-records?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
  }, [userId])

  return data
}

export function useImmunizations(userId: string | undefined) {
  const [data, setData] = useState<ImmunizationEntry[]>([])

  useEffect(() => {
    if (!userId) { setData([]); return }
    fetch(`/api/immunizations?userId=${userId}`)
      .then((res) => res.json())
      .then((json) => setData(json.data ?? []))
      .catch(() => setData([]))
  }, [userId])

  return data
}
