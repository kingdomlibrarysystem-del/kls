/**
 * Audit event category, per RULES.md §10 (required audit-log events).
 * `PUBLICATION_REJECTED` was added alongside the write path so a Reject
 * decision in the Review Queue has its own real category instead of being
 * silently folded into `PUBLICATION_APPROVED`.
 */
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'USER_CREATED'
  | 'ROLE_ASSIGNED'
  | 'BORROW_APPROVED'
  | 'PUBLICATION_APPROVED'
  | 'PUBLICATION_REJECTED'
  | 'PAYMENT_PROCESSED'

/** Matches /api/audit-log's real AuditLog rows — ipAddress/notes are null when not supplied at write time, not the mock's '—' placeholder. */
export interface AuditEntry {
  id: string
  actor: string
  action: AuditAction
  target: string
  /** ISO datetime string, as returned by the real API. */
  timestamp: string
  /** Originating IP address, shown only in the details view — too dense for the table row. */
  ipAddress: string | null
  /** Free-text context not captured by `target` alone, e.g. before/after values for a role change. */
  notes: string | null
}

export const auditActionLabels: Record<AuditAction, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  PASSWORD_RESET: 'Password Reset',
  USER_CREATED: 'User Created',
  ROLE_ASSIGNED: 'Role Assigned',
  BORROW_APPROVED: 'Borrow Approved',
  PUBLICATION_APPROVED: 'Publication Approved',
  PUBLICATION_REJECTED: 'Publication Rejected',
  PAYMENT_PROCESSED: 'Payment Processed',
}

