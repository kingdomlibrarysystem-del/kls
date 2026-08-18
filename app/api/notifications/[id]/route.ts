import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireStaff } from '@/lib/auth/require-role'

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

const patchNotificationSchema = z.object({ action: z.literal('markRead') })

export const PATCH = withErrorHandling('/api/notifications/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const auth = await requireStaff()
  if (auth.response) return auth.response

  const { id } = await params
  const parsed = patchNotificationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const existing = await prisma.notification.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Notification not found', 404)

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } })
  return NextResponse.json({ data: serializeNotification(updated), message: 'Notification marked read', code: 'success', status: 200 })
})
