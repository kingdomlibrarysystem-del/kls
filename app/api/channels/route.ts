import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { requireOwnerOrStaff, requireStaff } from '@/lib/auth/require-role'

/**
 * Real Channel API, replacing lib/messaging/types.ts's Channel + the
 * derive-on-every-read logic in derive-channels.ts (course channels
 * were never stored; DM channel ids were string-concatenated sorted
 * name pairs). Course channels are created once per real Course (see
 * seed-phase7.mjs); DM channels are created lazily by the first message
 * sent between two people (see /api/messages POST). Auth was
 * deliberately deferred when this route was first built, ahead of real
 * sessions existing (see /api/messages' own docstring) — now that real
 * sessions exist, a participantId-scoped read is ownership-checked like
 * every other "my own X" list in this codebase.
 */
function serializeChannel(c: {
  id: string
  kind: string
  name: string
  participantIds: string[]
  courseId: string | null
}) {
  return {
    id: c.id,
    kind: c.kind.toLowerCase(),
    name: c.name,
    participantIds: c.participantIds,
    courseId: c.courseId ?? undefined,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const participantId = searchParams.get('participantId')
  const kind = searchParams.get('kind')

  const auth = await (participantId ? requireOwnerOrStaff(participantId) : requireStaff())
  if (auth.response) return auth.response

  const where = {
    ...(participantId && { participantIds: { has: participantId } }),
    ...(kind && { kind: kind.toUpperCase() as 'COURSE' | 'DM' }),
  }

  const channels = await prisma.channel.findMany({ where, orderBy: { updatedAt: 'desc' } })

  return NextResponse.json({
    data: channels.map(serializeChannel),
    message: 'Channels fetched successfully',
    code: 'success',
    status: 200,
  })
}
