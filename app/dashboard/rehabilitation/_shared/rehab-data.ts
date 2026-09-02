/**
 * Rehabilitation types — real SupportGroup/RehabIntake/RehabSession/
 * RehabMilestone data comes from /api/rehabilitation/* (see
 * use-rehab.ts). Modeled directly on Health System's real shape;
 * APP_DOC.md leaves this module spec-less, so these shapes are
 * authored from rehabilitation/page.tsx's own placeholder hints.
 */

export type RehabIntakeStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'PLAN_CREATED' | 'DECLINED'
export type RehabSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED'

export interface SupportGroup {
  id: string
  name: string
  focus: string
  description: string
  meetingCadence: string
  image: string
}

export interface RehabIntake {
  id: string
  userId?: string
  memberName?: string
  concernArea: string
  history: string
  goals: string
  status: RehabIntakeStatus
  reviewedById?: string | null
  reviewNotes?: string | null
  submittedAt: string
}

export interface RehabSession {
  id: string
  userId?: string
  memberName?: string
  groupId?: string | null
  groupName?: string
  facilitatorId?: string | null
  facilitatorName?: string
  /** ISO datetime for the scheduled session. */
  dateTime: string
  focus: string
  status: RehabSessionStatus
}

export interface RehabMilestone {
  id: string
  userId: string
  sessionId?: string | null
  recordedById: string
  recordedByName?: string
  title: string
  description: string
  achievedAt: string
}

export const rehabIntakeStatusConfig: Record<RehabIntakeStatus, { label: string; cls: string }> = {
  SUBMITTED:    { label: 'Submitted',    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-blue-50   text-blue-800   border-blue-200' },
  PLAN_CREATED: { label: 'Plan Created', cls: 'bg-green-50  text-green-800  border-green-200' },
  DECLINED:     { label: 'Declined',     cls: 'bg-red-50    text-red-800    border-red-200' },
}

export const rehabSessionStatusConfig: Record<RehabSessionStatus, { label: string; cls: string }> = {
  SCHEDULED: { label: 'Scheduled', cls: 'bg-blue-50  text-blue-800  border-blue-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-w-100     text-w-800     border-w-300' },
  MISSED:    { label: 'Missed',    cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50   text-red-800   border-red-200' },
}
