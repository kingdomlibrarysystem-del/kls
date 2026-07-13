import type { UserRole } from '@/contexts/auth-context'

/**
 * Roles surfaced in every sidebar's "Switch View"/"Role Simulation" block.
 * Previously copy-pasted verbatim in member-sidebar.tsx, contributor-
 * sidebar.tsx, and dashboard/_components/sidebar.tsx — extracted once here
 * so adding a role (e.g. lecturer) means editing one file, not four.
 */
export const SWITCHABLE_ROLES = ["admin", "member", "contributor", "lecturer"] as const

export type SwitchableRole = (typeof SWITCHABLE_ROLES)[number]

export const roleViewLabel: Record<SwitchableRole, string> = {
  admin: "Admin View",
  member: "Member View",
  contributor: "Contributor View",
  lecturer: "Lecturer View",
}

export const roleViewRoute: Record<SwitchableRole, string> = {
  admin: "/dashboard",
  member: "/member",
  contributor: "/contributor",
  lecturer: "/lecturer",
}

/** Narrows a generic UserRole to SwitchableRole for the `user?.role === r` comparisons in each sidebar. */
export function isSwitchableRole(role: UserRole): role is SwitchableRole {
  return (SWITCHABLE_ROLES as readonly string[]).includes(role)
}
