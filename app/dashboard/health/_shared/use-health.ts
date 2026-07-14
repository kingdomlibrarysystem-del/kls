'use client'

import { useSyncExternalStore } from 'react'
import {
  initialAppointments, initialHealthRecords, initialImmunizations, CURRENT_MEMBER_NAME,
  type Appointment, type AppointmentStatus, type HealthRecordEntry, type ImmunizationEntry,
} from './health-data'

/**
 * Module-level mutable store for the Health System module — same
 * useSyncExternalStore pattern as use-enrollments.ts/use-session-requests.ts.
 * Health records and immunizations are read-only in this mock (no clinic
 * portal exists yet to write them), so only appointments have real
 * mutations; records/immunizations are exposed as plain snapshot hooks.
 */
let appointments: Appointment[] = [...initialAppointments]
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getAppointmentsSnapshot() {
  return appointments
}

function nextId() {
  const max = appointments.reduce((m, a) => {
    const n = Number(a.id.replace('appt-', ''))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `appt-${String(max + 1).padStart(3, '0')}`
}

export interface BookAppointmentInput {
  clinicId: string
  dateTime: string
  reason: string
}

/** Books a new PENDING checkup appointment for the current member persona. */
export function bookAppointment(input: BookAppointmentInput): Appointment {
  const created: Appointment = {
    id: nextId(),
    member: CURRENT_MEMBER_NAME,
    status: 'PENDING',
    ...input,
  }
  appointments = [created, ...appointments]
  emitChange()
  return created
}

/** Cancels a PENDING or CONFIRMED appointment. */
export function cancelAppointment(id: string) {
  appointments = appointments.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' as AppointmentStatus } : a))
  emitChange()
}

/** Live-subscribes to the shared appointments store. */
export function useAppointments() {
  return useSyncExternalStore(subscribe, getAppointmentsSnapshot, () => initialAppointments)
}

/**
 * Health records and immunizations have no write flow in this mock (they'd
 * be entered by a clinic/practitioner, not the member) — plain read hooks
 * returning the seed data, same shape as the assessment Review Queue's
 * read-only history before any admin action exists on it.
 */
export function useHealthRecords(): HealthRecordEntry[] {
  return initialHealthRecords
}

export function useImmunizations(): ImmunizationEntry[] {
  return initialImmunizations
}
