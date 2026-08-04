import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeSessionRequest(s: {
  id: string
  learnerId: string
  learnerName: string
  lecturerId: string
  lecturerName: string
  courseId: string
  courseTitle: string
  requestedAt: Date
  proposedTime: Date
  status: string
  mode: string
  scheduledAt: Date | null
  notes: string | null
}) {
  return {
    id: s.id,
    learnerId: s.learnerId,
    learnerName: s.learnerName,
    lecturerId: s.lecturerId,
    lecturerName: s.lecturerName,
    courseId: s.courseId,
    courseTitle: s.courseTitle,
    requestedAt: s.requestedAt.toISOString().split('T')[0],
    proposedTime: s.proposedTime.toISOString(),
    status: s.status,
    mode: s.mode,
    scheduledAt: s.scheduledAt ? s.scheduledAt.toISOString() : undefined,
    notes: s.notes ?? undefined,
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!sessionRequest) {
    return NextResponse.json({ data: null, message: 'Session request not found', code: 'error', status: 404 }, { status: 404 })
  }
  return NextResponse.json({ data: serializeSessionRequest(sessionRequest), message: 'Session request fetched successfully', code: 'success', status: 200 })
}

/** Status-transition guard porting the mock's approveSession/rejectSession/completeSession. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.sessionRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Session request not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.action === 'approve') {
      if (existing.status !== 'PENDING') {
        return NextResponse.json({ data: null, message: 'Only a pending session request can be approved', code: 'error', status: 409 }, { status: 409 })
      }
      const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : existing.proposedTime
      const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'APPROVED', scheduledAt, notes: body.notes ?? existing.notes } })
      return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request approved', code: 'success', status: 200 })
    }

    if (body.action === 'reject') {
      if (existing.status !== 'PENDING') {
        return NextResponse.json({ data: null, message: 'Only a pending session request can be rejected', code: 'error', status: 409 }, { status: 409 })
      }
      const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'REJECTED', notes: body.notes ?? existing.notes } })
      return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request rejected', code: 'success', status: 200 })
    }

    if (body.action === 'complete') {
      if (existing.status !== 'APPROVED') {
        return NextResponse.json({ data: null, message: 'Only an approved session can be completed', code: 'error', status: 409 }, { status: 409 })
      }
      const updated = await prisma.sessionRequest.update({ where: { id }, data: { status: 'COMPLETED' } })
      return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session marked complete', code: 'success', status: 200 })
    }

    const data: Record<string, unknown> = { ...body }
    delete data.action
    delete data.id
    delete data.learnerId
    delete data.lecturerId
    delete data.courseId
    const updated = await prisma.sessionRequest.update({ where: { id }, data })
    return NextResponse.json({ data: serializeSessionRequest(updated), message: 'Session request updated successfully', code: 'success', status: 200 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update session request', code: 'error', status: 500 }, { status: 500 })
  }
}
