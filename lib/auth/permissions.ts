import { NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireAuth, type AuthResult, type RouteSession } from '@/lib/auth/require-role'

/**
 * Role-permission checks (the `permissions` an admin ticks per role at
 * /dashboard/roles — keys like "publications:submit"). Admin always has
 * every permission; any other role has exactly what is ticked on it.
 *
 * Used so far by the publishing flow (submit / approve). Other modules still
 * use the coarse role checks in require-role.ts until they are converted.
 */

/** The permission keys of a role, read from the Role table by name ([] when the role is unknown). */
export async function getRolePermissions(roleName: string): Promise<string[]> {
  if (!roleName) return []
  const role = await prisma.role.findUnique({ where: { name: roleName }, select: { permissions: true } })
  return role?.permissions ?? []
}

export async function hasPermission(session: Pick<RouteSession, 'role' | 'roleName'>, permission: string): Promise<boolean> {
  if (session.role === 'admin') return true
  return (await getRolePermissions(session.roleName)).includes(permission)
}

/** For API routes: a signed-in user whose role has `permission` (Admin always passes); otherwise a 401/403 JSON response. */
export async function requirePermission(permission: string, message?: string): Promise<AuthResult> {
  const auth = await requireAuth()
  if (auth.response) return auth
  if (!(await hasPermission(auth.session, permission))) {
    return {
      response: NextResponse.json(
        { data: null, message: message ?? "Your role doesn't have permission to do this. Ask an admin to grant it in Roles & Permissions.", code: 'error', status: 403 },
        { status: 403 },
      ),
    }
  }
  return auth
}
