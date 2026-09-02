'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, Track, type RemoteParticipant, type LocalParticipant } from 'livekit-client'
import type { ActivityKind } from './use-session-activity'
import { wireLiveKitRoomEvents } from './wire-livekit-room-events'

export interface RemoteParticipantState {
  identity: string
  name: string
  cameraTrack: Track | null
  micTrack: Track | null
  screenTrack: Track | null
  micMuted: boolean
}

export type LiveKitDataMessage =
  | { kind: 'reaction'; id: string; emoji: string; senderName: string }
  | { kind: 'chat'; id: string; senderName: string; body: string; sentAt: string }
  | { kind: 'hand-raise'; raised: boolean; senderName: string }
  | { kind: 'activity'; id: string; activityKind: ActivityKind; actorName: string; detail?: string; at: string }

interface UseLiveKitRoomInput {
  sessionId: string
  displayName: string
  /** When false, the hook does nothing — lets the caller fall back to the local-only mock without ever opening a connection. */
  enabled: boolean
  onData?: (message: LiveKitDataMessage) => void
  /** Fires on LiveKit's own real ParticipantConnected/Disconnected events — server-verified join/leave, not a self-reported message, so the caller can log a real activity entry without this hook needing to know about the activity store itself. */
  onParticipantConnected?: (participant: RemoteParticipant) => void
  onParticipantDisconnected?: (participant: RemoteParticipant) => void
}

/**
 * Real WebRTC room connection via LiveKit Cloud — replaces
 * use-media-stream.ts's local-only getUserMedia/getDisplayMedia with
 * genuine publish/subscribe. Room name is the SessionRequest id (see
 * /api/session-requests/[id]/livekit-token), so everyone hitting the
 * same /room route joins the same real room. Event wiring lives in
 * wire-livekit-room-events.ts (kept separate to stay under the 200-line cap).
 */
export function useLiveKitRoom({ sessionId, displayName, enabled, onData, onParticipantConnected, onParticipantDisconnected }: UseLiveKitRoomInput) {
  const roomRef = useRef<Room | null>(null)
  const onDataRef = useRef(onData); onDataRef.current = onData
  const onConnectedRef = useRef(onParticipantConnected); onConnectedRef.current = onParticipantConnected
  const onDisconnectedRef = useRef(onParticipantDisconnected); onDisconnectedRef.current = onParticipantDisconnected

  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  // True when the token route rejected the join because the host isn't present yet (livekit-token route's reason: 'host-not-present') — distinct from a real connect failure.
  const [waitingForHost, setWaitingForHost] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [localVideoTrack, setLocalVideoTrack] = useState<Track | null>(null)
  const [localScreenTrack, setLocalScreenTrack] = useState<Track | null>(null)
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipantState>>(new Map())

  const updateRemote = useCallback((participant: RemoteParticipant) => {
    setRemoteParticipants((prev) => {
      const next = new Map(prev)
      const cameraPub = participant.getTrackPublication(Track.Source.Camera)
      const micPub = participant.getTrackPublication(Track.Source.Microphone)
      const screenPub = participant.getTrackPublication(Track.Source.ScreenShare)
      next.set(participant.identity, {
        identity: participant.identity,
        name: participant.name || participant.identity,
        cameraTrack: cameraPub?.track ?? null,
        micTrack: micPub?.track ?? null,
        screenTrack: screenPub?.track ?? null,
        micMuted: micPub ? micPub.isMuted : true,
      })
      return next
    })
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const room = new Room()
    roomRef.current = room

    wireLiveKitRoomEvents({
      room,
      updateRemote,
      removeRemote: (identity) => setRemoteParticipants((prev) => {
        const next = new Map(prev)
        next.delete(identity)
        return next
      }),
      onData: (message) => onDataRef.current?.(message),
      onParticipantConnected: (participant) => onConnectedRef.current?.(participant),
      onParticipantDisconnected: (participant) => onDisconnectedRef.current?.(participant),
    })

    let retryTimer: ReturnType<typeof setInterval> | undefined

    const attemptJoin = async () => {
      try {
        const res = await fetch(`/api/session-requests/${sessionId}/livekit-token?displayName=${encodeURIComponent(displayName)}`)
        const json = await res.json()
        if (json.reason === 'host-not-present') {
          if (!cancelled) setWaitingForHost(true)
          return
        }
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not join the real-time room')
        if (cancelled) return
        if (retryTimer) clearInterval(retryTimer)
        setWaitingForHost(false)
        await room.connect(json.data.url, json.data.token)
        if (cancelled) return
        setConnected(true)
      } catch (err) {
        if (!cancelled) setConnectError(err instanceof Error ? err.message : 'Could not join the real-time room')
      }
    }

    attemptJoin()
    // Re-check on the same cadence use-session-presence.ts's ROSTER_POLL_MS polls — once the host's own presence row appears, the next attempt succeeds and this interval is cleared.
    retryTimer = setInterval(attemptJoin, 8_000)

    return () => {
      cancelled = true
      if (retryTimer) clearInterval(retryTimer)
      room.disconnect()
      roomRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sessionId, displayName, updateRemote])

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    setConnectError(null)
    try {
      await room.localParticipant.setCameraEnabled(!cameraOn)
      const pub = room.localParticipant.getTrackPublication(Track.Source.Camera)
      setLocalVideoTrack(pub?.track ?? null)
      setCameraOn(!cameraOn)
    } catch {
      setConnectError('camera')
    }
  }, [cameraOn])

  const toggleMic = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    setConnectError(null)
    try {
      await room.localParticipant.setMicrophoneEnabled(!micOn)
      setMicOn(!micOn)
    } catch {
      setConnectError('mic')
    }
  }, [micOn])

  const togglePresenting = useCallback(async () => {
    const room = roomRef.current
    if (!room) return
    setConnectError(null)
    try {
      await room.localParticipant.setScreenShareEnabled(!presenting)
      const pub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare)
      setLocalScreenTrack(pub?.track ?? null)
      setPresenting(!presenting)
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError')) return
      setConnectError('screen-share')
    }
  }, [presenting])

  const sendData = useCallback((message: LiveKitDataMessage) => {
    const room = roomRef.current
    if (!room || !connected) return
    const bytes = new TextEncoder().encode(JSON.stringify(message)) as Uint8Array<ArrayBuffer>
    room.localParticipant.publishData(bytes, { reliable: true })
  }, [connected])

  const cleanup = useCallback(() => {
    roomRef.current?.disconnect()
  }, [])

  return {
    connected,
    connectError,
    waitingForHost,
    cameraOn,
    micOn,
    presenting,
    localVideoTrack,
    localScreenTrack,
    remoteParticipants: Array.from(remoteParticipants.values()),
    toggleCamera,
    toggleMic,
    togglePresenting,
    sendData,
    cleanup,
    localParticipant: roomRef.current?.localParticipant as LocalParticipant | undefined,
  }
}
