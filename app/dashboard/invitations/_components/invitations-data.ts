import type { invitableRoles } from './invitation-schema'

/** Invitation status, per APP_DOC Task 1.3 (invitation-based onboarding). */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED'

export interface Invitation {
  id: string
  email: string
  role: (typeof invitableRoles)[number]
  status: InvitationStatus
  sentAt: string
}

export const mockInvitations: Invitation[] = [
  { id: 'inv-001', email: 'daniel.mugisha@kingdom.edu', role: 'Manager',     status: 'PENDING',  sentAt: '2026-06-20' },
  { id: 'inv-002', email: 'clarisse.uwera@kingdom.edu',  role: 'Staff',       status: 'ACCEPTED', sentAt: '2026-06-10' },
  { id: 'inv-003', email: 'jean.baptiste@kingdom.edu',   role: 'Contributor', status: 'EXPIRED',  sentAt: '2026-05-01' },
]

export const invitationStatusConfig: Record<InvitationStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-50  text-green-800  border-green-200'  },
  EXPIRED:  { label: 'Expired',  cls: 'bg-w-100     text-w-700      border-w-300'      },
}
