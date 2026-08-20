'use client'

import { useCallback, useRef } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import { logActivity, receiveActivity, useSessionActivity } from './use-session-activity'
import type { LiveKitDataMessage } from './use-livekit-room'

/**
 * Wires real activity logging into the room: LiveKit's own
 * ParticipantConnected/Disconnected events (server-verified, not
 * self-reported) log join/leave, and a helper broadcasts + logs local
 * hand-raise/presenting/reaction events so every participant's feed
 * shows the same real history. `sendLiveKitData` is read through a ref
 * (set via `setSender` once the LiveKit hook itself is ready) rather
 * than a constructor argument, since this hook's own
 * onParticipantConnected/onParticipantDisconnected callbacks must be
 * created *before* the LiveKit hook that needs them — a real ordering
 * constraint, not an arbitrary choice. Split out of
 * session-room-view.tsx to keep it under the 200-line cap.
 */
export function useRoomActivityLogging(sessionId: string) {
  const entries = useSessionActivity(sessionId)
  const senderRef = useRef<((message: LiveKitDataMessage) => void) | undefined>(undefined)

  const setSender = useCallback((sender: ((message: LiveKitDataMessage) => void) | undefined) => {
    senderRef.current = sender
  }, [])

  const logAndBroadcast = useCallback((kind: Parameters<typeof logActivity>[1], actorName: string, detail?: string) => {
    const entry = logActivity(sessionId, kind, actorName, detail)
    senderRef.current?.({ kind: 'activity', id: entry.id, activityKind: entry.kind, actorName: entry.actorName, detail: entry.detail, at: entry.at })
  }, [sessionId])

  const onParticipantConnected = useCallback((participant: RemoteParticipant) => {
    logAndBroadcast('joined', participant.name || participant.identity)
  }, [logAndBroadcast])

  const onParticipantDisconnected = useCallback((participant: RemoteParticipant) => {
    logActivity(sessionId, 'left', participant.name || participant.identity)
  }, [sessionId])

  const handleActivityData = useCallback((message: LiveKitDataMessage) => {
    if (message.kind !== 'activity') return
    receiveActivity(sessionId, { id: message.id, kind: message.activityKind, actorName: message.actorName, detail: message.detail, at: message.at })
  }, [sessionId])

  return { entries, logAndBroadcast, setSender, onParticipantConnected, onParticipantDisconnected, handleActivityData }
}
