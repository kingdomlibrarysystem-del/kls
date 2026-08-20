'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { fetchSessionRequestById, completeSession, type SessionRequest } from '@/lib/sessions/use-session-requests'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import { useSessionPresence } from '@/lib/sessions/use-session-presence'
import { getJoinWindowState } from '@/lib/sessions/join-window'
import { RoomVideoCanvas } from './room-video-canvas'
import { RoomHeader } from './room-header'
import { AddParticipantModal } from './add-participant-modal'
import { SessionSidePanel } from './session-side-panel'
import { useRoomMedia } from './use-room-media'
import type { LiveKitDataMessage } from './use-livekit-room'
import { useSessionRecording } from './use-session-recording'
import { useLiveTranscript } from './use-live-transcript'
import { buildRoomParticipants } from './build-room-participants'
import { receiveSessionReaction } from './use-session-reactions'
import { receiveSessionMessage } from './use-session-chat'
import type { ParticipantDeviceState } from './participant-tile'

interface SessionRoomViewProps {
  sessionId: string
  /** Which portal is rendering this room — see the full docstring on the exported component below. */
  viewer: 'learner' | 'admin'
}

const OTHER_PARTY_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }
const ADDED_PARTICIPANT_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }

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
    role: viewer === 'admin' ? 'admin' : 'learner',
  })

  const handleLiveKitData = useCallback((message: LiveKitDataMessage) => {
    if (message.kind === 'reaction') receiveSessionReaction(message.id, message.emoji, message.senderName)
    else if (message.kind === 'chat') receiveSessionMessage(sessionId, message.id, message.senderName, message.body, message.sentAt)
    else if (message.kind === 'hand-raise') setOtherHandRaised(message.raised)
  }, [sessionId])

  const { liveKit, mockMedia, media, ready: liveKitReady, recordingStream } = useRoomMedia({
    sessionId,
    displayName: youNameForTranscript ?? 'You',
    enabled: !!request,
    onData: handleLiveKitData,
  })

  if (!loading && !request) {
    return <EmptyState icon={CalendarClock} title="Session not found" description="This session request doesn't exist." style={{ color: 'var(--text-secondary)' }} />
  }
  if (!request) return null

  const joinWindow = getJoinWindowState(request)
  if (!joinWindow.canJoin) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={joinWindow.reason === 'too-early' ? 'This session hasn\'t opened yet' : 'This session\'s window has passed'}
        description={joinWindow.reason === 'too-early' ? `The room opens at ${joinWindow.opensAt.toLocaleString()}.` : 'This scheduled session is no longer joinable — ask to reschedule if you still need it.'}
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const youName = viewer === 'learner' ? request.learnerName : adminDisplayName
  const otherName = viewer === 'admin' ? request.learnerName : (request.lecturerName ?? 'No lecturer assigned yet')
  const adminExtraParticipant = viewer === 'admin' && request.lecturerName ? { name: request.lecturerName, state: OTHER_PARTY_STATE } : null
  const isLecturerName = (name: string) => lecturerRoster.some((l) => l.name === name)
  const you: ParticipantDeviceState = { cameraOn: media.cameraOn, micOn: media.micOn, handRaised }
  const otherRemote = liveKit.remoteParticipants.find((p) => p.name === otherName || p.identity === request.lecturerId || p.identity === request.learnerId)
  // Once LiveKit is actually connected, a real remote participant in the
  // room IS the ground truth for "have they joined" — more reliable than
  // matching /presence's polled displayName string (case/whitespace
  // differences, or the 8s poll not having refreshed yet, previously
  // left this stuck on "Waiting to join…" even after the other party
  // genuinely connected). Presence stays the fallback for the mock path,
  // where there's no real connection to check at all.
  const otherPresent = liveKitReady ? !!otherRemote : presence.roster.some((p) => p.displayName === otherName && p.present)
  const otherState: ParticipantDeviceState = liveKitReady && otherRemote
    ? { cameraOn: !!otherRemote.cameraTrack, micOn: !otherRemote.micMuted, handRaised: otherHandRaised }
    : OTHER_PARTY_STATE

  const handleLeave = () => {
    presence.leaveNow()
    media.cleanup()
    recording.discard()
    transcript.stop()
    if (viewer === 'admin') completeSession(sessionId)
    router.push(backHref)
  }

  const toggleRecording = () => (recording.recording ? recording.stop() : recording.start(recordingStream))
  const toggleCaptions = () => (transcript.active ? transcript.stop() : transcript.start())

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
            youName={youName}
            you={you}
            youPresenting={media.presenting}
            youVideoStream={liveKitReady ? null : media.stream}
            youCameraTrack={liveKitReady ? liveKit.localVideoTrack : null}
            hideSelf={hideSelf}
            otherName={otherName}
            otherState={otherState}
            otherNotJoined={!otherPresent}
            otherCameraTrack={liveKitReady ? otherRemote?.cameraTrack : null}
            otherMicTrack={liveKitReady ? otherRemote?.micTrack : null}
            otherScreenTrack={liveKitReady ? otherRemote?.screenTrack : null}
            extraParticipants={[
              ...(adminExtraParticipant ? [adminExtraParticipant] : []),
              ...addedNames.map((name) => ({ name, state: ADDED_PARTICIPANT_STATE })),
            ]}
            transcriptActive={transcript.active}
            interimCaption={transcript.interimCaption}
            captionsUnsupported={transcript.unsupported}
            recording={recording.recording}
            recordingSeconds={recording.seconds}
            handRaised={handRaised}
            sidePanelHidden={sidePanelHidden}
            onToggleCamera={media.toggleCamera}
            onToggleMic={media.toggleMic}
            onToggleHand={() => {
              const next = !handRaised
              setHandRaised(next)
              if (liveKitReady) liveKit.sendData({ kind: 'hand-raise', raised: next, senderName: youName })
            }}
            onTogglePresenting={media.togglePresenting}
            onToggleRecording={toggleRecording}
            onToggleCaptions={toggleCaptions}
            onToggleHideSelf={() => setHideSelf((h) => !h)}
            onToggleSidePanel={() => setSidePanelHidden((h) => !h)}
            onAddParticipant={() => setAddOpen(true)}
            onLeave={handleLeave}
            leaveLabel={viewer === 'admin' ? 'End Session' : 'Leave'}
            sendLiveKitData={liveKitReady ? liveKit.sendData : undefined}
          />
        </div>

        {!sidePanelHidden && (
          <SessionSidePanel
            participants={buildRoomParticipants({
              viewer, youName, you, otherName, otherState,
              adminExtraParticipant, addedNames, addedState: ADDED_PARTICIPANT_STATE, isLecturerName,
              presenceRoster: presence.roster,
            })}
            sessionId={sessionId}
            senderName={youName}
            captionsOn={transcript.active || transcript.entries.length > 0}
            transcriptEntries={transcript.entries}
            transcriptUnsupported={transcript.unsupported}
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
