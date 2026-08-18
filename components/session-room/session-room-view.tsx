'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { fetchSessionRequestById, completeSession, type SessionRequest } from '@/lib/sessions/use-session-requests'
import { lecturerRoster } from '@/lib/identity/lecturer-identity'
import { useSessionPresence } from '@/lib/sessions/use-session-presence'
import { getJoinWindowState } from '@/lib/sessions/join-window'
import { RoomVideoCanvas } from './room-video-canvas'
import { RoomHeader } from './room-header'
import { AddParticipantModal } from './add-participant-modal'
import { SessionSidePanel } from './session-side-panel'
import { useMediaStream } from './use-media-stream'
import { useSessionRecording } from './use-session-recording'
import { useLiveTranscript } from './use-live-transcript'
import { buildRoomParticipants } from './build-room-participants'
import type { ParticipantDeviceState } from './participant-tile'

interface SessionRoomViewProps {
  sessionId: string
  /**
   * Which portal is rendering this room — determines "you"/"other party"
   * labels, back-link target, and the Leave-vs-End-Session action. Admin
   * is the party with real authority over sessions (approves/rejects
   * requests via SessionDecisionModal), so admin's Leave is the one that
   * genuinely calls completeSession() and writes COMPLETED back to the
   * shared session-requests store — a learner's Leave is just a
   * navigation. Both real participants (learner + lecturer) appear as
   * named tiles for the admin viewer rather than one being relabeled
   * "you", since an observing admin is neither party to the session.
   *
   * Previously had a third 'lecturer' mode before the portal
   * consolidation removed app/lecturer/** entirely — end-session
   * authority moved to 'admin' rather than being left unreachable.
   */
  viewer: 'learner' | 'admin'
}

const OTHER_PARTY_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }
const ADDED_PARTICIPANT_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }

/**
 * The Mock Session Room — one shared component reachable from
 * /member/sessions/[id]/room and /dashboard/e-learning/sessions/[id]/room
 * (admin oversight entry point). Camera, mic, screen-share, recording,
 * and live captions are all REAL browser APIs (getUserMedia/
 * getDisplayMedia/MediaRecorder/SpeechRecognition) — but only ever for
 * the local user's own stream/speech; raise-hand and hide-self-view stay
 * plain local state. Chat and quick reactions are backed by real
 * per-session stores; added participants genuinely appear as new
 * tiles/list rows (still avatar placeholders — see participant-tile.tsx
 * for why no other participant can ever show real video, audio, or
 * transcript here). Ending the session (admin only) genuinely writes
 * COMPLETED back into the shared session-requests store, not just a
 * navigation (see the `viewer` prop's docstring).
 */
export function SessionRoomView({ sessionId, viewer }: SessionRoomViewProps) {
  const router = useRouter()
  const [request, setRequest] = useState<SessionRequest | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const media = useMediaStream()
  const recording = useSessionRecording()
  const [handRaised, setHandRaised] = useState(false)
  const [hideSelf, setHideSelf] = useState(false)
  const [sidePanelHidden, setSidePanelHidden] = useState(false)
  const [addedNames, setAddedNames] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    fetchSessionRequestById(sessionId).then(setRequest).finally(() => setLoading(false))
  }, [sessionId])

  const backHref = viewer === 'learner' ? '/member/sessions' : '/dashboard/e-learning/sessions'
  const activeStream = media.presenting ? media.screenStream : media.stream
  const youNameForTranscript = viewer === 'learner' ? request?.learnerName : 'Admin (Observer)'
  const transcript = useLiveTranscript(youNameForTranscript ?? 'You')
  const presence = useSessionPresence({
    sessionRequestId: sessionId,
    displayName: youNameForTranscript ?? 'You',
    role: viewer === 'admin' ? 'admin' : 'learner',
  })

  if (!loading && !request) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Session not found"
        description="This session request doesn't exist."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  if (!request) return null

  const joinWindow = getJoinWindowState(request)
  if (!joinWindow.canJoin) {
    return (
      <EmptyState
        icon={CalendarClock}
        title={joinWindow.reason === 'too-early' ? 'This session hasn\'t opened yet' : 'This session\'s window has passed'}
        description={
          joinWindow.reason === 'too-early'
            ? `The room opens at ${joinWindow.opensAt.toLocaleString()}.`
            : 'This scheduled session is no longer joinable — ask to reschedule if you still need it.'
        }
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const youName = viewer === 'learner' ? request.learnerName : 'Admin (Observer)'
  const otherName = viewer === 'admin' ? request.learnerName : (request.lecturerName ?? 'No lecturer assigned yet')
  const adminExtraParticipant = viewer === 'admin' && request.lecturerName ? { name: request.lecturerName, state: OTHER_PARTY_STATE } : null
  const isLecturerName = (name: string) => lecturerRoster.some((l) => l.name === name)
  const you: ParticipantDeviceState = { cameraOn: media.cameraOn, micOn: media.micOn, handRaised }
  const otherPresent = presence.roster.some((p) => p.displayName === otherName && p.present)

  const handleLeave = () => {
    presence.leaveNow()
    media.cleanup()
    recording.discard()
    transcript.stop()
    if (viewer === 'admin') completeSession(sessionId)
    router.push(backHref)
  }

  const toggleRecording = () => (recording.recording ? recording.stop() : recording.start(activeStream))
  const toggleCaptions = () => (transcript.active ? transcript.stop() : transcript.start())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <RoomHeader viewer={viewer} onBack={() => router.push(backHref)} mediaError={media.error} recordingError={recording.error} />

      <div className={`grid grid-cols-1 gap-3 ${sidePanelHidden ? '' : 'lg:grid-cols-[1fr_260px]'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RoomVideoCanvas
            sessionId={sessionId}
            youName={youName}
            you={you}
            youPresenting={media.presenting}
            youVideoStream={activeStream}
            hideSelf={hideSelf}
            otherName={otherName}
            otherState={OTHER_PARTY_STATE}
            otherNotJoined={!otherPresent}
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
            onToggleHand={() => setHandRaised((h) => !h)}
            onTogglePresenting={media.togglePresenting}
            onToggleRecording={toggleRecording}
            onToggleCaptions={toggleCaptions}
            onToggleHideSelf={() => setHideSelf((h) => !h)}
            onToggleSidePanel={() => setSidePanelHidden((h) => !h)}
            onAddParticipant={() => setAddOpen(true)}
            onLeave={handleLeave}
            leaveLabel={viewer === 'admin' ? 'End Session' : 'Leave'}
          />
        </div>

        {!sidePanelHidden && (
          <SessionSidePanel
            participants={buildRoomParticipants({
              viewer, youName, you, otherName, otherState: OTHER_PARTY_STATE,
              adminExtraParticipant, addedNames, addedState: ADDED_PARTICIPANT_STATE, isLecturerName,
              presenceRoster: presence.roster,
            })}
            sessionId={sessionId}
            senderName={youName}
            captionsOn={transcript.active || transcript.entries.length > 0}
            transcriptEntries={transcript.entries}
            transcriptUnsupported={transcript.unsupported}
            onRemoveParticipant={viewer === 'admin' ? presence.removeParticipant : undefined}
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
