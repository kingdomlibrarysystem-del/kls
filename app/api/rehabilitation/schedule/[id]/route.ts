import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { serializeSession, DETAIL_INCLUDE } from '@/lib/data/rehab-sessions'

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
