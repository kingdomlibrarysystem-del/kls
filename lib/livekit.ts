import { AccessToken } from 'livekit-server-sdk'

/** True once a real LiveKit Cloud project's credentials exist in .env — gates whether the room uses real WebRTC media or falls back to the local-only mock (see session-room-view.tsx). */
export function isLiveKitConfigured(): boolean {
  return !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET)
}

/**
 * Issues a real, short-lived LiveKit access token scoped to one room
 * (the sessionId) and one identity (the caller's own userId — never
 * another user's, enforced by the route calling this). Grants are
 * exactly what a session-room participant needs: join, publish their
 * own camera/mic/screen, and subscribe to everyone else's — nothing
 * admin-level like room recording/egress control, which this app's own
 * MediaRecorder-based local recording doesn't need from LiveKit anyway.
 */
export async function createLiveKitToken(roomName: string, identity: string, displayName: string): Promise<string> {
  if (!isLiveKitConfigured()) {
    throw new Error('LiveKit is not configured — LIVEKIT_URL/LIVEKIT_API_KEY/LIVEKIT_API_SECRET must be set in .env')
  }
  const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity,
    name: displayName,
    ttl: '4h',
  })
  token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true })
  return token.toJwt()
}
