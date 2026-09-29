import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole } from '@/lib/roles'
import type { RouteSession } from '@/lib/auth/require-role'

/**
 * Server-component counterpart of lib/auth/require-role.ts — for page.tsx
 * files that load their data on the server instead of fetching /api/* from
 * a client useEffect. Redirects instead of returning a 401/403 response.
 *
 * Wrapped in React `cache()` so a page and every server component under it
 * share ONE session lookup per request (getServerSession runs the JWT
 * callback, which re-checks the UserSession revocation row in the DB).
 */
export const getPageSession = cache(async (): Promise<RouteSession | null> => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const roleName = session.user.roleName ?? ''
  return { userId: session.user.id, role: roleNameToUserRole(roleName), roleName }
})

export function isStaffRole(role: RouteSession['role']): boolean {
  return role === 'admin' || role === 'manager' || role === 'staff'
}

/** Any signed-in user; otherwise redirects to login. */
export async function requirePageAuth(): Promise<RouteSession> {
  const session = await getPageSession()
  if (!session) redirect('/auth/login')
  return session
}

/** admin / manager / staff — mirrors requireStaff() and middleware's ADMIN_ROLES. */
export async function requireStaffPage(): Promise<RouteSession> {
  const session = await requirePageAuth()
  if (!isStaffRole(session.role)) redirect('/member')
  return session
}

/** The record's owner or staff — mirrors requireOwnerOrStaff(). Returns false instead of redirecting so the page can render notFound() (never reveal someone else's record exists). */
export function canAccessOwned(session: RouteSession, ownerUserId: string): boolean {
  return session.userId === ownerUserId || isStaffRole(session.role)
}
