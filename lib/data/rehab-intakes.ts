import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeIntake(i: {
  id: string
  userId: string
  concernArea: string
  history: string
  goals: string
  status: string
  reviewedById: string | null
  reviewNotes: string | null
  submittedAt: Date
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: i.id,
    userId: i.userId,
    memberName: i.user ? (i.user.name ?? `${i.user.firstName ?? ''} ${i.user.lastName ?? ''}`.trim()) : undefined,
    concernArea: i.concernArea,
    history: i.history,
    goals: i.goals,
    status: i.status,
    reviewedById: i.reviewedById,
    reviewNotes: i.reviewNotes,
    submittedAt: i.submittedAt.toISOString(),
  }
}

export const DETAIL_INCLUDE = { user: { select: { name: true, firstName: true, lastName: true } } } as const

/** One record in the GET /api/rehabilitation/intake/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getRehabIntakeDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.rehabIntake.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  return row ? { ownerId: row.userId, data: serializeIntake(row) } : null
}
