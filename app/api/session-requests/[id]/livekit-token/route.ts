import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/prisma/client'
import { withErrorHandling, ApiError } from '@/lib/api-error-handler'
import { requireAuth } from '@/lib/auth/require-role'
import { createLiveKitToken, isLiveKitConfigured } from '@/lib/livekit'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Issues a real LiveKit room-join token for this session's room —
 * roomName is the SessionRequest id itself, so everyone hitting the
 * same /room route lands in the same real WebRTC room. The caller can
 * only ever get a token for their own identity (their real userId),
 * never someone else's, matching the same rule /presence already
 * enforces. Returns a clear 503 (not a 500) when LiveKit isn't
 * configured yet, so the room UI can fall back to the local-only mock
 * instead of a raw error.
 */
export const GET = withErrorHandling('/api/session-requests/[id]/livekit-token', 'GET', async (request: NextRequest, { params }: RouteParams) => {
  if (!isLiveKitConfigured()) {
    return NextResponse.json({ data: null, message: 'Real-time video is not configured for this environment yet.', code: 'error', status: 503 }, { status: 503 })
  }

  const auth = await requireAuth()
  if (auth.response) return auth.response

  const { id } = await params
  const sessionRequest = await prisma.sessionRequest.findUnique({ where: { id } })
  if (!sessionRequest) throw new ApiError('Session request not found', 404)

  const { searchParams } = new URL(request.url)
  const displayName = searchParams.get('displayName')?.trim() || 'Participant'

  const token = await createLiveKitToken(id, auth.session.userId, displayName)

  return NextResponse.json({
    data: { token, url: process.env.LIVEKIT_URL, roomName: id },
    message: 'Token issued successfully',
    code: 'success',
    status: 200,
  })
})
