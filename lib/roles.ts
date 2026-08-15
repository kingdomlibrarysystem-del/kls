export type UserRole = 'admin' | 'manager' | 'staff' | 'member'

/**
 * Maps a dynamic Role.name (admin-defined, free text) onto the fixed
 * UserRole union the UI's RBAC checks use. Defaults to "member" for
 * anything unrecognized.
 *
 * Deliberately kept in a plain (non 'use client') module, not
 * contexts/auth-context.tsx — middleware.ts runs this in the Edge
 * runtime, and Next.js 16 rejects calling a function exported from a
 * 'use client' file from server code, even when the function itself
 * (as here) has no React or browser dependency.
 */
export function roleNameToUserRole(roleName: string): UserRole {
  const normalized = roleName.trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'administrator') return 'admin'
  if (normalized === 'manager') return 'manager'
  if (normalized === 'staff') return 'staff'
  return 'member'
}
