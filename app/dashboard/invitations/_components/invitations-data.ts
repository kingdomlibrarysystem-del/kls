/** Invitation status, per APP_DOC Task 1.3 (invitation-based onboarding). */
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED'

/** Matches /api/invitations' real serialization — role is the joined Role record, not a free-text string. */
export interface Invitation {
  id: string
  email: string
  role: { id: string; name: string }
  status: InvitationStatus
  sentAt: string
}

export const invitationStatusConfig: Record<InvitationStatus, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-50  text-green-800  border-green-200'  },
  EXPIRED:  { label: 'Expired',  cls: 'bg-w-100     text-w-700      border-w-300'      },
}
