/** Audit event category, per RULES.md §10 (required audit-log events). */
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'USER_CREATED'
  | 'ROLE_ASSIGNED'
  | 'BORROW_APPROVED'
  | 'PUBLICATION_APPROVED'
  | 'PAYMENT_PROCESSED'

export interface AuditEntry {
  id: string
  actor: string
  action: AuditAction
  target: string
  timestamp: string
}

export const auditActionLabels: Record<AuditAction, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  PASSWORD_RESET: 'Password Reset',
  USER_CREATED: 'User Created',
  ROLE_ASSIGNED: 'Role Assigned',
  BORROW_APPROVED: 'Borrow Approved',
  PUBLICATION_APPROVED: 'Publication Approved',
  PAYMENT_PROCESSED: 'Payment Processed',
}

/** A few realistic entries per required category, per RULES.md §10. */
export const mockAuditEntries: AuditEntry[] = [
  { id: 'aud-001', actor: 'Admin User',           action: 'LOGIN',                 target: 'Session',                        timestamp: '2026-06-28 08:12' },
  { id: 'aud-002', actor: 'Manager User',          action: 'LOGIN',                 target: 'Session',                        timestamp: '2026-06-28 08:40' },
  { id: 'aud-003', actor: 'Manager User',          action: 'LOGOUT',                target: 'Session',                        timestamp: '2026-06-28 12:05' },
  { id: 'aud-004', actor: 'Alice Johnson',         action: 'PASSWORD_RESET',        target: 'alice@kingdom.edu',              timestamp: '2026-06-27 14:22' },
  { id: 'aud-005', actor: 'Admin User',            action: 'USER_CREATED',          target: 'David Wilson (member)',          timestamp: '2026-06-26 09:15' },
  { id: 'aud-006', actor: 'Admin User',            action: 'ROLE_ASSIGNED',         target: 'Bob Smith → Librarian',          timestamp: '2026-06-25 11:03' },
  { id: 'aud-007', actor: 'Staff User',            action: 'BORROW_APPROVED',       target: 'Jean Paul Nkurunziza — The Pursuit of Knowledge', timestamp: '2026-06-24 15:47' },
  { id: 'aud-008', actor: 'Manager User',          action: 'PUBLICATION_APPROVED',  target: 'Voices of the Revival',          timestamp: '2026-06-20 10:30' },
  { id: 'aud-009', actor: 'System',                action: 'PAYMENT_PROCESSED',     target: 'Amina Uwimana — 1,200 RWF (Rental)', timestamp: '2026-06-18 16:52' },
  { id: 'aud-010', actor: 'Admin User',            action: 'LOGIN',                 target: 'Session',                        timestamp: '2026-06-15 07:58' },
]
