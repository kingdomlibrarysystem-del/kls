'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Room, RoomEvent, Track, type RemoteParticipant, type LocalParticipant } from 'livekit-client'
import type { ActivityKind } from './use-session-activity'

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
 * genuine publish/subscribe: the local user's camera/mic/screen are
 * published as real tracks other participants' browsers actually
 * receive, and every remote participant's own published tracks are
 * exposed here as real MediaStreamTracks ready to attach to <video>/
 * <audio> elements. Room name is the SessionRequest id (see
 * /api/session-requests/[id]/livekit-token), so everyone hitting the
 * same /room route joins the same real room.
 */
export function useLiveKitRoom({ sessionId, displayName, enabled, onData, onParticipantConnected, onParticipantDisconnected }: UseLiveKitRoomInput) {
  const roomRef = useRef<Room | null>(null)
  const onDataRef = useRef(onData)
  onDataRef.current = onData
  const onConnectedRef = useRef(onParticipantConnected)
  onConnectedRef.current = onParticipantConnected
  const onDisconnectedRef = useRef(onParticipantDisconnected)
  onDisconnectedRef.current = onParticipantDisconnected

  const [connected, setConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
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

    room
      .on(RoomEvent.TrackSubscribed, (_track, _pub, participant) => updateRemote(participant))
      .on(RoomEvent.TrackUnsubscribed, (_track, _pub, participant) => updateRemote(participant))
      .on(RoomEvent.TrackMuted, (_pub, participant) => { if (participant !== room.localParticipant) updateRemote(participant as RemoteParticipant) })
      .on(RoomEvent.TrackUnmuted, (_pub, participant) => { if (participant !== room.localParticipant) updateRemote(participant as RemoteParticipant) })
      .on(RoomEvent.ParticipantConnected, (participant) => { onConnectedRef.current?.(participant) })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteParticipants((prev) => {
          const next = new Map(prev)
          next.delete(participant.identity)
          return next
        })
        onDisconnectedRef.current?.(participant)
      })
      .on(RoomEvent.DataReceived, (payload, participant) => {
        if (!participant) return
        try {
          const message = JSON.parse(new TextDecoder().decode(payload)) as LiveKitDataMessage
          onDataRef.current?.(message)
        } catch {
          // Ignore malformed payloads rather than crashing the room.
        }
      })

    ;(async () => {
      try {
        const res = await fetch(`/api/session-requests/${sessionId}/livekit-token?displayName=${encodeURIComponent(displayName)}`)
        const json = await res.json()
        if (!res.ok || json.code !== 'success') throw new Error(json.message ?? 'Could not join the real-time room')
        if (cancelled) return
        await room.connect(json.data.url, json.data.token)
        if (cancelled) return
        setConnected(true)
      } catch (err) {
        if (!cancelled) setConnectError(err instanceof Error ? err.message : 'Could not join the real-time room')
      }
    })()

    return () => {
      cancelled = true
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
