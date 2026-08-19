import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireOwnerOrStaff } from '@/lib/auth/require-role'

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
  const { id } = await params
  const parsed = patchNotificationSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const existing = await prisma.notification.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Notification not found', 404)

  // A per-person notification can only be marked read by that real person
  // (or staff). A role-broadcast row (no recipientId set) has no single
  // owner, so only staff — who are the only ones who could see it at
  // all, per GET's own no-recipientId-means-staff rule — can mark it read.
  const auth = await requireOwnerOrStaff(existing.recipientId ?? '__no-owner__')
  if (auth.response) return auth.response

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } })
  return NextResponse.json({ data: serializeNotification(updated), message: 'Notification marked read', code: 'success', status: 200 })
})
