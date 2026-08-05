import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Notification not found', code: 'error', status: 404 }, { status: 404 })
    }
    if (body.action === 'markRead') {
      const updated = await prisma.notification.update({ where: { id }, data: { read: true } })
      return NextResponse.json({ data: serializeNotification(updated), message: 'Notification marked read', code: 'success', status: 200 })
    }
    return NextResponse.json({ data: null, message: 'Unknown action', code: 'error', status: 400 }, { status: 400 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update notification', code: 'error', status: 500 }, { status: 500 })
  }
}
