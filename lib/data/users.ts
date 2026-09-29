import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

/** Only the columns serializeUser reads — never pulls passwordHash, 2FA secrets, etc. off the user document. */
export const USER_DETAIL_SELECT = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
  emailVerified: true,
  createdAt: true,
  notificationPreferences: true,
  role: { select: { name: true } },
} as const

export function serializeUser(u: {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string
  status: string
  role: { name: string } | null
  emailVerified: Date | null
  createdAt: Date
  notificationPreferences?: unknown
}) {
  return {
    id: u.id,
    name: u.name ?? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
    firstName: u.firstName ?? '',
    lastName: u.lastName ?? '',
    email: u.email,
    role: u.role?.name ?? 'Member',
    status: u.status.toLowerCase(),
    emailVerified: !!u.emailVerified,
    createdAt: u.createdAt.toISOString().split('T')[0],
    notificationPreferences: (u.notificationPreferences as Record<string, boolean> | null) ?? {},
  }
}

/** Single user in the exact shape GET /api/users/[id] returns. */
export async function getUserDetail(id: string) {
  if (!isObjectId(id)) return null
  const user = await prisma.user.findUnique({ where: { id }, select: USER_DETAIL_SELECT })
  return user ? serializeUser(user) : null
}
