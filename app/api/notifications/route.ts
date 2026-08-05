import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

/**
 * Real Notification API, replacing
 * app/dashboard/notifications/_components/notifications-data.ts's
 * mockNotifications array. `recipientRole` (kept from the mock — many
 * real notifications are genuinely role-broadcast, e.g. "a new
 * enrollment" is meaningful to any admin viewer) and an added optional
 * `recipientId` for when a caller has a specific real person in mind.
 */
function serializeNotification(n: {
  id: string
  type: string
  title: string
  message: string
  href: string
  read: boolean
  recipientRole: string
  recipientId: string | null
  createdAt: Date
}) {
  return {
    id: n.id,
    type: n.type.toLowerCase(),
    title: n.title,
    message: n.message,
    href: n.href,
    read: n.read,
    recipientRole: n.recipientRole,
    recipientId: n.recipientId ?? undefined,
    time: n.createdAt.toISOString(),
  }
}

const VALID_TYPES = ['BORROW', 'RESERVATION', 'COURSE', 'PUBLICATION', 'DUE', 'SYSTEM']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const recipientRole = searchParams.get('recipientRole')
  const recipientId = searchParams.get('recipientId')
  const read = searchParams.get('read')

  const where = {
    ...(recipientRole && { recipientRole }),
    ...(recipientId && { recipientId }),
    ...(read !== null && { read: read === 'true' }),
  }

  const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })

  return NextResponse.json({
    data: notifications.map(serializeNotification),
    message: 'Notifications fetched successfully',
    code: 'success',
    status: 200,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.type || !body.title || !body.message || !body.href || !body.recipientRole) {
      return NextResponse.json({ data: null, message: 'Missing required fields: type, title, message, href, recipientRole', code: 'error', status: 400 }, { status: 400 })
    }
    if (!VALID_TYPES.includes(body.type.toUpperCase())) {
      return NextResponse.json({ data: null, message: `Invalid type — must be one of ${VALID_TYPES.join(', ')}`, code: 'error', status: 400 }, { status: 400 })
    }
    if (body.recipientId) {
      const recipient = await prisma.user.findUnique({ where: { id: body.recipientId } })
      if (!recipient) {
        return NextResponse.json({ data: null, message: 'The specified recipient does not exist', code: 'error', status: 400 }, { status: 400 })
      }
    }
    const notification = await prisma.notification.create({
      data: {
        type: body.type.toUpperCase(),
        title: body.title,
        message: body.message,
        href: body.href,
        recipientRole: body.recipientRole,
        recipientId: body.recipientId ?? null,
      },
    })
    return NextResponse.json({ data: serializeNotification(notification), message: 'Notification created successfully', code: 'success', status: 201 }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to create notification', code: 'error', status: 500 }, { status: 500 })
  }
}
