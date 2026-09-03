'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { fetchSessionRequestById, type SessionRequest } from '@/lib/sessions/use-session-requests'
import { useSessionPresence } from '@/lib/sessions/use-session-presence'
import { getJoinWindowState } from '@/lib/sessions/join-window'
import { RoomAccessGuard } from './room-access-guard'
import { RoomVideoCanvas } from './room-video-canvas'
import { RoomHeader } from './room-header'
import { AddParticipantModal } from './add-participant-modal'
import { SessionSidePanel } from './session-side-panel'
import { useRoomMedia } from './use-room-media'
import type { LiveKitDataMessage } from './use-livekit-room'
import { useSessionRecording } from './use-session-recording'
import { useLiveTranscript } from './use-live-transcript'
import { receiveSessionReaction } from './use-session-reactions'
import { receiveSessionMessage } from './use-session-chat'
import { useRoomActivityLogging } from './use-room-activity-logging'
import { logActivity } from './use-session-activity'
import { useRoomViewState } from './use-room-view-state'

interface SessionRoomViewProps {
  sessionId: string
  /** Which portal is rendering this room — see the full docstring on the exported component below. */
  viewer: 'learner' | 'admin'
}

/**
 * Session room — real WebRTC (via LiveKit Cloud) once LIVEKIT_URL/
 * LIVEKIT_API_KEY/LIVEKIT_API_SECRET are configured, falling back to the
 * original local-only mock (see RoomHeader's disclaimer) when they
 * aren't. Reachable from /member/sessions/[id]/room and
 * /dashboard/e-learning/sessions/[id]/room. Presence (who has really
 * opened the room) stays on the existing polled SessionPresence API
 * regardless of LiveKit — that's about roster/kick, not media. Chat and
 * quick reactions are broadcast over LiveKit's real-time data channel
 * when connected, so every participant's browser genuinely receives
 * them (previously an in-memory-per-tab store, invisible across
 * separate devices).
 */
export function SessionRoomView({ sessionId, viewer }: SessionRoomViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [request, setRequest] = useState<SessionRequest | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [otherHandRaised, setOtherHandRaised] = useState(false)
  const [hideSelf, setHideSelf] = useState(false)
  const [sidePanelHidden, setSidePanelHidden] = useState(false)
  const [addedNames, setAddedNames] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const recording = useSessionRecording()

  useEffect(() => {
    fetchSessionRequestById(sessionId).then(setRequest).finally(() => setLoading(false))
  }, [sessionId])

  const backHref = viewer === 'learner' ? '/member/sessions' : '/dashboard/e-learning/sessions'
  // An admin/staff viewer joins with their own real identity (matches how
  // staff already get unrestricted real access elsewhere, e.g. the
  // reading paywall bypass) rather than a fixed "Admin (Observer)"
  // label — they're a genuine participant, not a name-only placeholder.
  const adminDisplayName = user ? `${user.firstName} ${user.lastName}`.trim() || 'Admin' : 'Admin'
  const youNameForTranscript = viewer === 'learner' ? request?.learnerName : adminDisplayName
  const transcript = useLiveTranscript(youNameForTranscript ?? 'You')
  const presence = useSessionPresence({
    sessionRequestId: sessionId,
    userId: user?.id,
    displayName: youNameForTranscript ?? 'You',
  })

  const activity = useRoomActivityLogging(sessionId)

  const handleLiveKitData = useCallback((message: LiveKitDataMessage) => {
    if (message.kind === 'reaction') { receiveSessionReaction(message.id, message.emoji, message.senderName); logActivity(sessionId, 'reacted', message.senderName, message.emoji) }
    else if (message.kind === 'chat') receiveSessionMessage(sessionId, message.id, message.senderName, message.body, message.sentAt)
    else if (message.kind === 'hand-raise') setOtherHandRaised(message.raised)
    else if (message.kind === 'activity') activity.handleActivityData(message)
  }, [sessionId, activity])

  const { liveKit, mockMedia, media, ready: liveKitReady, recordingStream } = useRoomMedia({
    sessionId,
    displayName: youNameForTranscript ?? 'You',
    enabled: !!request,
    onData: handleLiveKitData,
    onParticipantConnected: activity.onParticipantConnected,
    onParticipantDisconnected: activity.onParticipantDisconnected,
  })
  activity.setSender(liveKit.connected && !liveKit.connectError ? liveKit.sendData : undefined)

  useEffect(() => {
    // LiveKit's ParticipantConnected only ever fires for REMOTE
    // participants, never the local user themselves — log the local
    // user's own "joined" once, the moment their own connection goes live.
    if (liveKitReady) activity.logAndBroadcast('joined', youNameForTranscript ?? 'You')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKitReady])

  const {
    youName, otherName, you, otherRemote, otherPresent, otherState, extraParticipants, roomParticipants,
    handleLeave, toggleRecording, toggleCaptions, toggleHand: toggleHandState, togglePresenting,
  } = useRoomViewState({
    sessionId, viewer, request, adminDisplayName, handRaised, otherHandRaised, addedNames,
    media, liveKit, liveKitReady, presence, recording, recordingStream, transcript, activity,
    onLeft: () => router.push(backHref),
  })
  const toggleHand = () => setHandRaised(toggleHandState())

  const blocked = !request || getJoinWindowState(request).canJoin === false || liveKit.waitingForHost
  if (blocked) return <RoomAccessGuard loading={loading} request={request} waitingForHost={liveKit.waitingForHost} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RoomHeader
        viewer={viewer}
        onBack={() => router.push(backHref)}
        mediaError={liveKitReady ? null : mockMedia.error}
        recordingError={recording.error}
        liveKitActive={liveKitReady}
        liveKitConnectError={liveKit.connectError}
      />

      <div className={`grid grid-cols-1 gap-3 ${sidePanelHidden ? '' : 'lg:grid-cols-[1fr_260px]'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RoomVideoCanvas
            sessionId={sessionId}
            you={{
              name: youName, state: you, presenting: media.presenting, handRaised,
              videoStream: liveKitReady ? null : media.stream,
              cameraTrack: liveKitReady ? liveKit.localVideoTrack : null,
            }}
            other={{
              name: otherName, state: otherState, notJoined: !otherPresent,
              cameraTrack: liveKitReady ? otherRemote?.cameraTrack : null,
              micTrack: liveKitReady ? otherRemote?.micTrack : null,
              screenTrack: liveKitReady ? otherRemote?.screenTrack : null,
            }}
            extraParticipants={extraParticipants}
            transcriptActive={transcript.active}
            interimCaption={transcript.interimCaption}
            captionsUnsupported={transcript.unsupported}
            recording={recording.recording}
            recordingSeconds={recording.seconds}
            controls={{
              hideSelf, sidePanelHidden,
              onToggleCamera: media.toggleCamera,
              onToggleMic: media.toggleMic,
              onToggleHand: toggleHand,
              onTogglePresenting: togglePresenting,
              onToggleRecording: toggleRecording,
              onToggleCaptions: toggleCaptions,
              onToggleHideSelf: () => setHideSelf((h) => !h),
              onToggleSidePanel: () => setSidePanelHidden((h) => !h),
              onAddParticipant: () => setAddOpen(true),
              onLeave: handleLeave,
              leaveLabel: viewer === 'admin' ? 'End Session' : 'Leave',
            }}
            sendLiveKitData={liveKitReady ? liveKit.sendData : undefined}
            onReact={(emoji) => activity.logAndBroadcast('reacted', youName, emoji)}
          />
        </div>

        {!sidePanelHidden && (
          <SessionSidePanel
            participants={roomParticipants}
            sessionId={sessionId}
            senderName={youName}
            captionsOn={transcript.active || transcript.entries.length > 0}
            transcriptEntries={transcript.entries}
            transcriptUnsupported={transcript.unsupported}
            activityEntries={activity.entries}
            onRemoveParticipant={viewer === 'admin' ? presence.removeParticipant : undefined}
            sendLiveKitData={liveKitReady ? liveKit.sendData : undefined}
          />
        )}
      </div>

      <AddParticipantModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        excludeNames={[youName, otherName, ...addedNames]}
        onAdd={(name) => setAddedNames((names) => [...names, name])}
      />
    </div>
  )
}
