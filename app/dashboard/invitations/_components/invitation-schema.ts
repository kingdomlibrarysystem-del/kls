import { z } from 'zod'

/**
 * Invitable roles, per APP_DOC Task 1.3 — Super Admin invites Managers,
 * Managers invite Staff. This mocked form offers both regardless of the
 * current user's role; a real system would filter this list server-side
 * by the inviter's own role.
 *
 * 'Contributor' was removed during portal consolidation — Admin and
 * Member are the only two portals now, and there is no UI left for a
 * Contributor persona to use an invitation into that role.
 */
export const invitableRoles = ['Manager', 'Staff'] as const

export const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(invitableRoles, { message: 'Select a role' }),
})

export type InvitationFormData = z.infer<typeof invitationSchema>
