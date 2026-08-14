import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'

/**
 * Real Message API, replacing lib/messaging/use-messages.ts's
 * useSyncExternalStore mock (senderName/readBy/reactedBy were all free
 * text, zero real ids). This surface stays UNWIRED from the live
 * member-facing UI for now (see PROGRESS.md's Phase 7 entry) — the
 * member Messages page presents itself as "your own inbox" with no
 * real session behind "who you are," the same class of gap Phase 3/4/5
 * already declined to paper over. Built and verified for real so a
 * genuine auth-aware caller can use it once real sessions exist.
 */
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  if (!channelId) {
    return NextResponse.json({ data: null, message: 'Missing required query param: channelId', code: 'error', status: 400 }, { status: 400 })
  }
  const messages = await prisma.message.findMany({ where: { channelId }, orderBy: { sentAt: 'asc' } })
  return NextResponse.json({ data: messages.map(serializeMessage), message: 'Messages fetched successfully', code: 'success', status: 200 })
}

const sendMessageSchema = z.object({
  senderId: z.string().min(1, 'senderId is required'),
  body: z.string().trim().min(1, 'body is required'),
  channelId: z.string().optional(),
  participantIds: z.array(z.string()).length(2, 'Starting a new DM requires exactly 2 participantIds').optional(),
})

/** Sends a message; if `channelId` doesn't yet exist and `participantIds` (exactly 2) is provided, lazily creates the DM channel first — mirroring the mock's own dmChannelId()-on-first-message semantics. */
export const POST = withErrorHandling('/api/messages', 'POST', async (request: NextRequest) => {
  const parsed = sendMessageSchema.safeParse(await request.json())
  if (!parsed.success) {
    throw new ApiError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
  }
  const body = parsed.data

  const sender = await prisma.user.findUnique({ where: { id: body.senderId } })
  if (!sender) throw new ApiError('The specified sender does not exist', 400)

  let channelId = body.channelId
  if (!channelId) {
    if (!body.participantIds) {
      throw new ApiError('Starting a new DM requires exactly 2 participantIds', 400)
    }
    const sorted = [...body.participantIds].sort()
    const existing = await prisma.channel.findFirst({ where: { kind: 'DM', participantIds: { equals: sorted } } })
    if (existing) {
      channelId = existing.id
    } else {
      const otherUser = await prisma.user.findUnique({ where: { id: body.participantIds.find((id) => id !== body.senderId) } })
      const created = await prisma.channel.create({
        data: { kind: 'DM', name: otherUser?.name ?? 'Direct Message', participantIds: sorted },
      })
      channelId = created.id
    }
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      senderId: body.senderId,
      senderName: sender.name ?? `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim(),
      body: body.body,
      readByIds: [body.senderId],
    },
  })
  await prisma.channel.update({ where: { id: channelId }, data: { updatedAt: new Date() } })

  return NextResponse.json({ data: serializeMessage(message), message: 'Message sent successfully', code: 'success', status: 201 }, { status: 201 })
})
