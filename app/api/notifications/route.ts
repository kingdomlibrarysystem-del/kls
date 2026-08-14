import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

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

const createNotificationSchema = z.object({
  type: z.preprocess((v) => (typeof v === 'string' ? v.toUpperCase() : v), z.enum(['BORROW', 'RESERVATION', 'COURSE', 'PUBLICATION', 'DUE', 'SYSTEM'])),
  title: z.string().trim().min(1, 'title is required'),
  message: z.string().trim().min(1, 'message is required'),
  href: z.string().trim().min(1, 'href is required'),
  recipientRole: z.string().trim().min(1, 'recipientRole is required'),
  recipientId: z.string().optional(),
})

export const POST = withErrorHandling('/api/notifications', 'POST', async (request: NextRequest) => {
  const parsed = createNotificationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  if (body.recipientId) {
    const recipient = await prisma.user.findUnique({ where: { id: body.recipientId } })
    if (!recipient) throw new ApiError('The specified recipient does not exist', 400)
  }

  const notification = await prisma.notification.create({
    data: {
      type: body.type,
      title: body.title,
      message: body.message,
      href: body.href,
      recipientRole: body.recipientRole,
      recipientId: body.recipientId ?? null,
    },
  })
  return NextResponse.json({ data: serializeNotification(notification), message: 'Notification created successfully', code: 'success', status: 201 }, { status: 201 })
})
