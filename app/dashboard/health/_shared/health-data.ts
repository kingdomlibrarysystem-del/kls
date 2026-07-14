/**
 * Health System data model — the reusable template for the remaining
 * "Coming Soon" modules (Beauty Services, Consultation & Counseling,
 * Rehabilitation, Donations, News). See PROGRESS.md's "Coming Soon module
 * template" section for the pattern this file + use-health.ts establish.
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
  member: string
  clinicId: string
  /** ISO datetime for the requested/confirmed checkup. */
  dateTime: string
  reason: string
  status: AppointmentStatus
}

export interface HealthRecordEntry {
  id: string
  member: string
  /** ISO date of the consultation. */
  date: string
  clinicId: string
  summary: string
  prescriptions: string[]
  referral?: string
}

export interface ImmunizationEntry {
  id: string
  member: string
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

/** This mock has a single live member persona — see use-enrollments.ts's CURRENT_MEMBER_NAME. */
export const CURRENT_MEMBER_NAME = 'John Doe'

export const clinics: Clinic[] = [
  { id: 'clinic-1', name: 'Kingdom Family Clinic', specialty: 'General Practice', location: 'Kigali, Kacyiru', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop' },
  { id: 'clinic-2', name: 'Nyarutarama Wellness Center', specialty: 'Internal Medicine', location: 'Kigali, Nyarutarama', image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=400&fit=crop' },
  { id: 'clinic-3', name: 'Remera Maternal & Child Health', specialty: 'Pediatrics', location: 'Kigali, Remera', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=400&fit=crop' },
  { id: 'clinic-4', name: 'Kimihurura Dental & Wellness', specialty: 'Dentistry', location: 'Kigali, Kimihurura', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop' },
]

/**
 * Seed appointments so Book a Checkup's "My Appointments" list isn't empty
 * on first load — same precedent as session-requests-data.ts's seed rows.
 */
export const initialAppointments: Appointment[] = [
  { id: 'appt-1', member: CURRENT_MEMBER_NAME, clinicId: 'clinic-1', dateTime: '2026-07-22T09:30', reason: 'Annual general checkup', status: 'CONFIRMED' },
  { id: 'appt-2', member: CURRENT_MEMBER_NAME, clinicId: 'clinic-4', dateTime: '2026-06-18T14:00', reason: 'Routine dental cleaning', status: 'COMPLETED' },
  { id: 'appt-3', member: CURRENT_MEMBER_NAME, clinicId: 'clinic-2', dateTime: '2026-07-30T11:00', reason: 'Persistent headaches, follow-up requested', status: 'PENDING' },
]

export const initialHealthRecords: HealthRecordEntry[] = [
  {
    id: 'rec-1', member: CURRENT_MEMBER_NAME, date: '2026-06-18', clinicId: 'clinic-4',
    summary: 'Routine dental cleaning and checkup. No cavities found; mild gum sensitivity noted.',
    prescriptions: ['Sensodyne toothpaste, twice daily'],
  },
  {
    id: 'rec-2', member: CURRENT_MEMBER_NAME, date: '2026-04-02', clinicId: 'clinic-1',
    summary: 'Presented with seasonal flu symptoms — fever, cough. Prescribed rest and medication.',
    prescriptions: ['Paracetamol 500mg, every 6 hours as needed', 'Vitamin C supplement, once daily'],
    referral: 'Follow up with Nyarutarama Wellness Center if symptoms persist beyond 7 days.',
  },
]

export const initialImmunizations: ImmunizationEntry[] = [
  { id: 'imm-1', member: CURRENT_MEMBER_NAME, vaccine: 'Tetanus-Diphtheria (Td) Booster', dateAdministered: '2024-03-10', nextDue: '2034-03-10' },
  { id: 'imm-2', member: CURRENT_MEMBER_NAME, vaccine: 'Influenza (Seasonal)', dateAdministered: '2026-05-15', nextDue: '2027-05-15' },
]
