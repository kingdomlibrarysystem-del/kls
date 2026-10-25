import prisma from '@/prisma/client'
import { isObjectId } from '@/lib/server/object-id'

export function serializeSession(s: {
  id: string
  userId: string
  counselorId: string
  proposedTime: Date
  mode: string
  reason: string
  status: string
  contactPhone?: string | null
  meetingDetails?: string | null
  staffNote?: string | null
  counselor?: { name: string; specialty: string; userId?: string | null }
  user?: { name: string | null; firstName: string | null; lastName: string | null }
}) {
  return {
    id: s.id,
    userId: s.userId,
    counselorId: s.counselorId,
    counselorName: s.counselor?.name,
    counselorSpecialty: s.counselor?.specialty,
    memberName: s.user ? (s.user.name ?? `${s.user.firstName ?? ''} ${s.user.lastName ?? ''}`.trim()) : undefined,
    proposedTime: s.proposedTime.toISOString(),
    mode: s.mode,
    reason: s.reason,
    status: s.status,
    contactPhone: s.contactPhone ?? null,
    meetingDetails: s.meetingDetails ?? null,
    staffNote: s.staffNote ?? null,
    /** The counselor's staff account (to message them), when linked. */
    counselorUserId: s.counselor?.userId ?? null,
  }
}

export const DETAIL_INCLUDE = { counselor: { select: { name: true, specialty: true, userId: true } }, user: { select: { name: true, firstName: true, lastName: true } } } as const

/** One record in the GET /api/counseling/sessions/[id] shape, plus its owner id for the owner-or-staff check. */
export async function getCounselingSessionDetail(id: string) {
  if (!isObjectId(id)) return null
  const row = await prisma.counselingSession.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  return row ? { ownerId: row.userId, data: serializeSession(row) } : null
}
