export type UserRole = 'admin' | 'manager' | 'staff' | 'member'

/**
 * Maps a dynamic Role.name (admin-defined, free text) onto the fixed
 * UserRole union the app's access checks use.
 *
 * Rule (project owner): ONLY the "Member" role uses the member portal
 * (/member). Every other role — Admin, Manager, Staff and any role an admin
 * creates at /dashboard/roles ("Graphic Design Manager", "Editor"...) —
 * works in the admin dashboard (/dashboard). So an unrecognized name maps to
 * "staff", the least-privileged dashboard role: it never grants the
 * admin-only operations (requireAdmin).
 *
 * This used to return "member" for every unrecognized name, which sent every
 * custom role to the member portal and locked it out of /dashboard.
 *
 * A missing/empty name is still "member": no role means no dashboard access.
 *
 * Deliberately kept in a plain (non 'use client') module, not
 * contexts/auth-context.tsx — middleware.ts runs this in the Edge
 * runtime, and Next.js 16 rejects calling a function exported from a
 * 'use client' file from server code, even when the function itself
 * (as here) has no React or browser dependency.
 */
export function roleNameToUserRole(roleName: string): UserRole {
  const normalized = (roleName ?? '').trim().toLowerCase()
  if (!normalized || normalized === 'member') return 'member'
  if (normalized === 'admin' || normalized === 'administrator') return 'admin'
  if (normalized === 'manager') return 'manager'
  return 'staff'
}
