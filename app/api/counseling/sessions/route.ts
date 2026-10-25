import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'
import { notifyAllStaff, notifyUser } from '@/lib/notify'
import { serializeSession, DETAIL_INCLUDE } from '@/lib/data/counseling-sessions'
import { isObjectId } from '@/lib/server/object-id'

/** Counseling sessions: a member books one (phone, video call or in person); staff confirm, complete or cancel it. */
const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const PHONE = /^(\+?25)?(078|079|075|073|072)\d{7}$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const auth = await requireOwnerOrStaff(userId)
    if (auth.response) return auth.response
    const sessions = await prisma.counselingSession.findMany({ where: { userId }, include: DETAIL_INCLUDE, orderBy: { proposedTime: 'desc' } })
    return NextResponse.json({ data: sessions.map(serializeSession), message: 'Counseling sessions fetched successfully', code: 'success', status: 200 })
  }

  const auth = await requireStaff()
  if (auth.response) return auth.response
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '50')
  const status = searchParams.get('status')
  const where = { ...(status && status !== 'all' && VALID_STATUSES.includes(status) && { status: status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) }
  const [totalItems, sessions] = await Promise.all([
    prisma.counselingSession.count({ where }),
    prisma.counselingSession.findMany({ where, include: DETAIL_INCLUDE, orderBy: { proposedTime: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  ])
  const totalPages = Math.ceil(totalItems / pageSize)
  return NextResponse.json({
    data: sessions.map(serializeSession),
    message: 'Counseling sessions fetched successfully',
    code: 'success',
    status: 200,
    pagination: { page, pageSize, totalItems, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
  })
}

const requestSessionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  counselorId: z.string().min(1, 'Choose a counselor'),
  proposedTime: z.string().datetime({ message: 'Choose a date and time' }),
  mode: z.enum(['IN_PERSON', 'VIRTUAL', 'PHONE']).default('IN_PERSON'),
  /** Required for a PHONE session — the number the counselor calls. */
  contactPhone: z.string().trim().max(20).optional(),
  reason: z.string().trim().min(5, 'Tell us briefly what you would like to talk about').max(2000),
})

/**
 * POST /api/counseling/sessions — a member asks for a session. It starts
 * PENDING; staff (and the counselor's linked account) are notified to confirm.
 */
export const POST = withErrorHandling('/api/counseling/sessions', 'POST', async (request: NextRequest) => {
  const parsed = requestSessionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  const body = parsed.data

  const auth = await requireOwnerOrStaff(body.userId)
  if (auth.response) return auth.response

  const when = new Date(body.proposedTime)
  if (when.getTime() < Date.now() + 30 * 60 * 1000) throw new ApiError('Choose a time at least 30 minutes from now', 400)
  if (body.mode === 'PHONE' && !PHONE.test((body.contactPhone ?? '').replace(/\s/g, ''))) {
    throw new ApiError('Enter the MTN or Airtel number the counselor should call, e.g. 078 123 4567', 400)
  }
  if (!isObjectId(body.counselorId)) throw new ApiError('Choose a counselor', 400)

  const [user, counselor] = await Promise.all([
    prisma.user.findUnique({ where: { id: body.userId }, select: { id: true, name: true, firstName: true, lastName: true } }),
    prisma.counselor.findUnique({ where: { id: body.counselorId } }),
  ])
  if (!user) throw new ApiError('The specified user does not exist', 400)
  if (!counselor || !counselor.active) throw new ApiError('This counselor is not taking bookings right now — choose another', 400)

  const session = await prisma.counselingSession.create({
    data: {
      userId: body.userId,
      counselorId: body.counselorId,
      proposedTime: when,
      mode: body.mode,
      contactPhone: body.mode === 'PHONE' ? body.contactPhone!.replace(/\s/g, '') : null,
      reason: body.reason,
      status: 'PENDING',
    },
    include: DETAIL_INCLUDE,
  })

  const memberName = user.name || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'A member'
  const how = body.mode === 'PHONE' ? 'phone call' : body.mode === 'VIRTUAL' ? 'video call' : 'in-person session'
  await notifyAllStaff({ type: 'SYSTEM', category: 'session-reminder', title: 'New counseling request', message: `${memberName} asked for a ${how} with ${counselor.name}.`, href: '/dashboard/counseling/admin' }).catch(() => {})
  if (counselor.userId) {
    await notifyUser({ userId: counselor.userId, type: 'SYSTEM', category: 'session-reminder', title: 'New counseling request', message: `${memberName} asked for a ${how} with you.`, href: '/dashboard/counseling/admin' }).catch(() => {})
  }

  return NextResponse.json({ data: serializeSession(session), message: 'Request sent — you will be notified when it is confirmed', code: 'success', status: 201 }, { status: 201 })
})
