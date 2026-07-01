import { z } from 'zod'

/**
 * Invitable roles, per APP_DOC Task 1.3 — Super Admin invites Managers,
 * Managers invite Staff/Contributors. This mocked form offers all three
 * regardless of the current user's role; a real system would filter this
 * list server-side by the inviter's own role.
 */
export const invitableRoles = ['Manager', 'Staff', 'Contributor'] as const

export const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(invitableRoles, { message: 'Select a role' }),
})

export type InvitationFormData = z.infer<typeof invitationSchema>
