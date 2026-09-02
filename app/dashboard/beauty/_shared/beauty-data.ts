/**
 * Beauty Services types — real BeautyProvider/BeautyService/
 * BeautyAppointment/BeautyReview data comes from /api/beauty/*
 * (see use-beauty.ts). APP_DOC.md leaves this module spec-less, so
 * these shapes are authored from beauty/page.tsx's own placeholder
 * "Planned API Endpoints" hints rather than an official spec, modeled
 * directly on Health System's real shape.
 */

export type BeautyAppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface BeautyProvider {
  id: string
  name: string
  specialties: string[]
  location: string
  image: string
  bio?: string
  avgRating: number
  reviewCount: number
}

export interface BeautyService {
  id: string
  providerId: string
  name: string
  category: string
  priceRwf: number
  durationMins: number
  description?: string
}

export interface BeautyAppointment {
  id: string
  userId?: string
  providerId: string
  providerName?: string
  serviceId: string
  serviceName?: string
  priceRwf?: number
  memberName?: string
  /** ISO datetime for the requested/confirmed appointment. */
  dateTime: string
  notes?: string
  status: BeautyAppointmentStatus
}

export interface BeautyReview {
  id: string
  userId: string
  userName: string
  providerId: string
  appointmentId: string
  rating: number
  comment?: string
  createdAt: string
}

export const beautyAppointmentStatusConfig: Record<BeautyAppointmentStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-green-50  text-green-800  border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100      text-w-800      border-w-300' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50    text-red-800    border-red-200' },
}
