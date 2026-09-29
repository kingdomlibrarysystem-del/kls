import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { serializeSession, DETAIL_INCLUDE } from '@/lib/data/counseling-sessions'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await prisma.counselingSession.findUnique({ where: { id }, include: DETAIL_INCLUDE })
  if (!session) {
    return NextResponse.json({ data: null, message: 'Session not found', code: 'error', status: 404 }, { status: 404 })
  }
  const auth = await requireOwnerOrStaff(session.userId)
  if (auth.response) return auth.response
  return NextResponse.json({ data: serializeSession(session), message: 'Session fetched successfully', code: 'success', status: 200 })
}

/** A member can cancel their own PENDING/CONFIRMED session; staff can additionally confirm/complete — same split as /api/appointments/[id]. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.counselingSession.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Session not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.status === 'CANCELLED') {
      const auth = await requireOwnerOrStaff(existing.userId)
      if (auth.response) return auth.response
    } else if (body.status === 'CONFIRMED' || body.status === 'COMPLETED') {
      const auth = await requireStaff()
      if (auth.response) return auth.response
    } else {
      return NextResponse.json({ data: null, message: "status must be one of 'CONFIRMED', 'COMPLETED', 'CANCELLED'", code: 'error', status: 400 }, { status: 400 })
    }

    const updated = await prisma.counselingSession.update({ where: { id }, data: { status: body.status }, include: DETAIL_INCLUDE })
    return NextResponse.json({ data: serializeSession(updated), message: 'Session updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update session', code: 'error', status: 500 }, { status: 500 })
  }
}
