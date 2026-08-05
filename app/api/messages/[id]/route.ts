import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'

function serializeMessage(m: {
  id: string
  channelId: string
  senderId: string
  senderName: string
  body: string
  sentAt: Date
  readByIds: string[]
  reactions: { emoji: string; reactedByIds: string[] }[]
}) {
  return {
    id: m.id,
    channelId: m.channelId,
    senderId: m.senderId,
    senderName: m.senderName,
    body: m.body,
    sentAt: m.sentAt.toISOString(),
    readByIds: m.readByIds,
    reactions: m.reactions.map((r) => ({ emoji: r.emoji, reactedByIds: r.reactedByIds })),
  }
}

/** action: 'markRead' | 'toggleReaction' — porting markChannelRead/toggleReaction's per-message semantics. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.message.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ data: null, message: 'Message not found', code: 'error', status: 404 }, { status: 404 })
    }

    if (body.action === 'markRead') {
      if (!body.userId) {
        return NextResponse.json({ data: null, message: 'Missing required field: userId', code: 'error', status: 400 }, { status: 400 })
      }
      const readByIds = existing.readByIds.includes(body.userId) ? existing.readByIds : [...existing.readByIds, body.userId]
      const updated = await prisma.message.update({ where: { id }, data: { readByIds } })
      return NextResponse.json({ data: serializeMessage(updated), message: 'Message marked read', code: 'success', status: 200 })
    }

    if (body.action === 'toggleReaction') {
      if (!body.userId || !body.emoji) {
        return NextResponse.json({ data: null, message: 'Missing required fields: userId, emoji', code: 'error', status: 400 }, { status: 400 })
      }
      const reactions = existing.reactions.map((r) => ({ ...r }))
      const idx = reactions.findIndex((r) => r.emoji === body.emoji)
      if (idx === -1) {
        reactions.push({ emoji: body.emoji, reactedByIds: [body.userId] })
      } else if (reactions[idx].reactedByIds.includes(body.userId)) {
        reactions[idx].reactedByIds = reactions[idx].reactedByIds.filter((uid) => uid !== body.userId)
      } else {
        reactions[idx].reactedByIds.push(body.userId)
      }
      const finalReactions = reactions.filter((r) => r.reactedByIds.length > 0)
      const updated = await prisma.message.update({ where: { id }, data: { reactions: finalReactions } })
      return NextResponse.json({ data: serializeMessage(updated), message: 'Reaction updated', code: 'success', status: 200 })
    }

    return NextResponse.json({ data: null, message: 'Unknown action', code: 'error', status: 400 }, { status: 400 })
  } catch {
    return NextResponse.json({ data: null, message: 'Failed to update message', code: 'error', status: 500 }, { status: 500 })
  }
}
