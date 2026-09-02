/**
 * Consultation & Counseling types — real Counselor/CounselingSession/
 * CounselingNote/CounselingConsent data comes from /api/counseling/*
 * (see use-counseling.ts). Modeled directly on Health System's real
 * shape; APP_DOC.md leaves this module spec-less, so these shapes are
 * authored from counseling/page.tsx's own placeholder hints.
 */

export type CounselingSessionMode = 'IN_PERSON' | 'VIRTUAL'
export type CounselingSessionStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface Counselor {
  id: string
  name: string
  specialty: string
  bio?: string
  image: string
}

export interface CounselingSession {
  id: string
  userId?: string
  counselorId: string
  counselorName?: string
  counselorSpecialty?: string
  memberName?: string
  /** ISO datetime for the requested/confirmed session. */
  proposedTime: string
  mode: CounselingSessionMode
  reason: string
  status: CounselingSessionStatus
}

export interface CounselingNote {
  id: string
  sessionId: string
  userId: string
  authorId: string
  authorName?: string
  summary: string
  followUp?: string | null
  createdAt: string
}

export interface CounselingConsent {
  userId: string
  shareNotesWithMember: boolean
  allowStaffContact: boolean
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
}

export const counselingSessionStatusConfig: Record<CounselingSessionStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-green-50  text-green-800  border-green-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100      text-w-800      border-w-300' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50    text-red-800    border-red-200' },
}

export const counselingModeLabels: Record<CounselingSessionMode, string> = {
  IN_PERSON: 'In Person',
  VIRTUAL: 'Virtual',
}
