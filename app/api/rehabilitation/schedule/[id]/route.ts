import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

function serializeSession(s: {
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

const DETAIL_INCLUDE = {
  group: { select: { name: true } },
  facilitator: { select: { name: true, firstName: true, lastName: true } },
  user: { select: { name: true, firstName: true, lastName: true } },
} as const

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await prisma.rehabSession.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  if (!session) {
    return NextResponse.json({ data: null, message: 'Session not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(session.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeSession(session), message: 'Session fetched successfully', code: 'success', status: 200 })
}

/** Staff-only status transitions: complete, markMissed, cancel — matches scheduling itself being staff-only. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const auth = await requireStaff()
    if (auth.response) return auth.response

    const existing = await prisma.rehabSession.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Session not found', code: 'error', status: 404 }, { status: 404 })
    }

    const statusByAction: Record<string, 'COMPLETED' | 'MISSED' | 'CANCELLED'> = {
      complete: 'COMPLETED',
      markMissed: 'MISSED',
      cancel: 'CANCELLED',
    }
    const status = statusByAction[body.action]
    if (!status) {
      return NextResponse.json({ data: null, message: "action must be one of 'complete', 'markMissed', 'cancel'", code: 'error', status: 400 }, { status: 400 })
    }

    const updated = await prisma.rehabSession.update({ where: { id }, data: { status }, include: DETAIL_INCLUDE })
    return NextResponse.json({ data: serializeSession(updated), message: 'Session updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update session', code: 'error', status: 500 }, { status: 500 })
  }
}
