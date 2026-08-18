import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { roleNameToUserRole, type UserRole } from '@/lib/roles'

/** The identity resolved from a real, non-revoked session — id + normalized role, ready to compare or scope a query with. */
export interface RouteSession {
  userId: string
  role: UserRole
  roleName: string
}

export type AuthResult = { session: RouteSession; response?: undefined } | { session?: undefined; response: NextResponse }

function unauthorized(message = 'You must be signed in to do this.'): NextResponse {
  return NextResponse.json({ data: null, message, code: 'error', status: 401 }, { status: 401 })
}

function forbidden(message = "You don't have permission to do this."): NextResponse {
  return NextResponse.json({ data: null, message, code: 'error', status: 403 }, { status: 403 })
}

/**
 * Real session/role checks for API route handlers — previously nonexistent
 * anywhere except app/api/chapters/route.ts (the one route that already
 * inlined this exact idiom). middleware.ts's matcher only covers
 * /dashboard/* and /member/*, NOT /api/:path*, so every route handler is
 * directly reachable by an anonymous client unless it checks for itself.
 *
 * Returns `{ response }` (a ready-to-return 401/403 NextResponse) instead
 * of throwing, so it works identically in both `withErrorHandling`-wrapped
 * routes and the ~40 routes still using a bare `export async function`
 * that would turn a thrown error into an uncaught 500 rather than a clean
 * 401/403 JSON body. Call pattern:
 *
 *   const auth = await requireAuth()
 *   if (auth.response) return auth.response
 *   const { userId } = auth.session
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { response: unauthorized() }
  const roleName = session.user.roleName ?? ''
  return { session: { userId: session.user.id, role: roleNameToUserRole(roleName), roleName } }
}

/** Same as requireAuth, but also requires the resolved role to be one of `roles`. */
export async function requireRole(roles: UserRole[]): Promise<AuthResult> {
  const auth = await requireAuth()
  if (auth.response) return auth
  if (!roles.includes(auth.session.role)) return { response: forbidden() }
  return auth
}

/** admin, manager, or staff — the same bucket middleware.ts's ADMIN_ROLES uses for /dashboard/* route access. */
export function requireStaff(): Promise<AuthResult> {
  return requireRole(['admin', 'manager', 'staff'])
}

/** admin only — for privilege-escalation-sensitive operations (role definitions/permissions, global settings, audit log visibility, role reassignment) where even a manager/staff account should not have access. */
export function requireAdmin(): Promise<AuthResult> {
  return requireRole(['admin'])
}

/**
 * For a "my own X" endpoint: requires a real session AND that the caller's
 * own userId matches `resourceUserId` (typically taken from a query param
 * or request body that was previously trusted blindly) — OR that the
 * caller is staff, who may act across users for legitimate admin/support
 * purposes. Prevents a logged-in member from reading/writing another
 * member's data by passing a different id, a real, separate gap from
 * "no session check at all" (a member could authenticate fine, then
 * simply substitute someone else's userId in the query string).
 */
export async function requireOwnerOrStaff(resourceUserId: string): Promise<AuthResult> {
  const auth = await requireAuth()
  if (auth.response) return auth
  const { userId, role } = auth.session
  const isStaff = role === 'admin' || role === 'manager' || role === 'staff'
  if (userId !== resourceUserId && !isStaff) return { response: forbidden("You can only access your own data.") }
  return auth
}
