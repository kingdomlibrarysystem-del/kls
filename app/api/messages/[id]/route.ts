import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

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

const patchMessageSchema = z.union([
  z.object({ action: z.literal('markRead'), userId: z.string().min(1, 'userId is required') }),
  z.object({ action: z.literal('toggleReaction'), userId: z.string().min(1, 'userId is required'), emoji: z.string().min(1, 'emoji is required') }),
])

/** action: 'markRead' | 'toggleReaction' — porting markChannelRead/toggleReaction's per-message semantics. */
export const PATCH = withErrorHandling('/api/messages/[id]', 'PATCH', async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const parsed = patchMessageSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const existing = await prisma.message.findUnique({ where: { id } })
  if (!existing) throw new ApiError('Message not found', 404)

  if (body.action === 'markRead') {
    const readByIds = existing.readByIds.includes(body.userId) ? existing.readByIds : [...existing.readByIds, body.userId]
    const updated = await prisma.message.update({ where: { id }, data: { readByIds } })
    return NextResponse.json({ data: serializeMessage(updated), message: 'Message marked read', code: 'success', status: 200 })
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
})
