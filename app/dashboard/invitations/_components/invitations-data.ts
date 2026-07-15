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
  { id: 'inv-001', email: 'daniel.mugisha@kingdom.edu',   role: 'Manager',     status: 'PENDING',  sentAt: '2026-06-20' },
  { id: 'inv-002', email: 'clarisse.uwera@kingdom.edu',    role: 'Staff',       status: 'ACCEPTED', sentAt: '2026-06-10' },
  { id: 'inv-003', email: 'jean.baptiste@kingdom.edu',     role: 'Staff',       status: 'EXPIRED',  sentAt: '2026-05-01' },
  { id: 'inv-004', email: 'olivier.hakizimana@kingdom.edu', role: 'Staff',       status: 'ACCEPTED', sentAt: '2026-04-18' },
  { id: 'inv-005', email: 'diane.uwase@kingdom.edu',       role: 'Staff',       status: 'PENDING',  sentAt: '2026-06-25' },
  { id: 'inv-006', email: 'samuel.byiringiro@kingdom.edu', role: 'Staff',       status: 'ACCEPTED', sentAt: '2026-03-12' },
  { id: 'inv-007', email: 'esther.kabatesi@kingdom.edu',   role: 'Staff',       status: 'EXPIRED',  sentAt: '2026-02-28' },
  { id: 'inv-008', email: 'peter.niyonzima@kingdom.edu',   role: 'Manager',     status: 'ACCEPTED', sentAt: '2026-02-05' },
  { id: 'inv-009', email: 'mary.nyiraneza@kingdom.edu',    role: 'Staff',       status: 'PENDING',  sentAt: '2026-06-27' },
  { id: 'inv-010', email: 'robert.anderson@kingdom.edu',   role: 'Staff',       status: 'EXPIRED',  sentAt: '2026-01-15' },
  { id: 'inv-011', email: 'kamanzi.pierre@kingdom.edu',    role: 'Staff',       status: 'ACCEPTED', sentAt: '2026-01-02' },
  { id: 'inv-012', email: 'joseph.nkurunziza@kingdom.edu', role: 'Manager',     status: 'PENDING',  sentAt: '2026-06-29' },
]

export const invitationStatusConfig: Record<InvitationStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-50  text-green-800  border-green-200'  },
  EXPIRED:  { label: 'Expired',  cls: 'bg-w-100     text-w-700      border-w-300'      },
}
