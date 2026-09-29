import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeSession(s: {
  id: string
  userId: string
  groupId: string | null
  facilitatorId: string | null
  dateTime: Date
  focus: string
  status: string
  group?: { name: string } | null
  facilitator?: { name: string | null; firstName: string | null; lastName: string | null } | null
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: s.id,
    userId: s.userId,
    memberName: s.user ? (s.user.name ?? `${s.user.firstName ?? ''} ${s.user.lastName ?? ''}`.trim()) : undefined,
    groupId: s.groupId,
    groupName: s.group?.name,
    facilitatorId: s.facilitatorId,
    facilitatorName: s.facilitator ? (s.facilitator.name ?? `${s.facilitator.firstName ?? ''} ${s.facilitator.lastName ?? ''}`.trim()) : undefined,
    dateTime: s.dateTime.toISOString(),
    focus: s.focus,
    status: s.status,
  }
}

export const DETAIL_INCLUDE = {
  group: { select: { name: true } },
  facilitator: { select: { name: true, firstName: true, lastName: true } },
  user: { select: { name: true, firstName: true, lastName: true } },
} as const

/** One record in the GET /api/rehabilitation/schedule/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getRehabSessionDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.rehabSession.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  return row ? { ownerId: row.userId, data: serializeSession(row) } : null
}
