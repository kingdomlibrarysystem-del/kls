import prisma from '@/prisma/client'

/**
 * Soft delete ("Trash") for user accounts — RULES.md "Database Standards":
 * `deletedAt` + `deletedBy` instead of removing the row. A trashed account
 * keeps all its data, cannot sign in, and is hidden from user lists until it
 * is restored. Permanent deletion is lib/data/user-deletion.ts.
 */

/**
 * Prisma `where` fragment for "not in Trash". On MongoDB a field that was
 * never written is "unset", which `deletedAt: null` does NOT match — every
 * user created before this feature has no deletedAt at all — so both cases
 * are needed.
 */
export const NOT_TRASHED = { OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }] }
export const IN_TRASH = { deletedAt: { not: null } }

/** Moves the account to Trash and signs it out everywhere (its UserSession rows are revoked). */
export async function moveUserToTrash(userId: string, actorId: string): Promise<void> {
  const now = new Date()
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { deletedAt: now, deletedBy: actorId } }),
    prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
  ])
}

/** Takes the account out of Trash; the user can sign in again with their existing password. */
export async function restoreUser(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: null, deletedBy: null } })
}
