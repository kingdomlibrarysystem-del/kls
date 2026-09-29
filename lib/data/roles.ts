import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

/** Single role plus its assigned-user count, in the exact shape GET /api/roles/[id] returns. */
export async function getRoleDetail(id: string) {
  if (!isObjectId(id)) return null
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  })
  if (!role) return null
  const { _count, ...roleFields } = role
  return { ...roleFields, userCount: _count.users }
}
