/**
 * Health System types — real Clinic/Appointment/HealthRecord/
 * Immunization data now comes from /api/clinics, /api/appointments,
 * /api/health-records, /api/immunizations (see use-health.ts). APP_DOC.md
 * leaves this module spec-less ("backlog only, no task-level spec yet"),
 * so these shapes are authored from what the frontend already needed
 * rather than an official spec.
 */

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface Clinic {
  id: string
  name: string
  specialty: string
  location: string
  /** Real Unsplash photo URL — generic clinic/practitioner imagery, no identifiable individuals. */
  image: string
}

export interface Appointment {
  id: string
  clinicId: string
  /** ISO datetime for the requested/confirmed checkup. */
  dateTime: string
  reason: string
  status: AppointmentStatus
}

export interface HealthRecordEntry {
  id: string
  /** ISO date of the consultation. */
  date: string
  clinicId: string
  summary: string
  prescriptions: string[]
  referral?: string
}

export interface ImmunizationEntry {
  id: string
  vaccine: string
  /** ISO date administered. */
  dateAdministered: string
  /** ISO date next due, if a booster/follow-up is expected. */
  nextDue?: string
}

export const appointmentStatusConfig: Record<AppointmentStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-green-50  text-green-800  border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100      text-w-800      border-w-300' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50    text-red-800    border-red-200' },
}
