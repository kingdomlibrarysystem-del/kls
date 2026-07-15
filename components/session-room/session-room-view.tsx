'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, CalendarClock, Circle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests, completeSession } from '@/app/lecturer/_shared/use-session-requests'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { VideoTileGrid } from './video-tile-grid'
import { ControlBar } from './control-bar'
import { AddParticipantModal } from './add-participant-modal'
import { ReactionBar } from './reaction-bar'
import { ReactionBurst } from './reaction-burst'
import { LiveCaptionOverlay } from './live-caption-overlay'
import { SessionSidePanel } from './session-side-panel'
import { RoomErrorBanner } from './room-error-banner'
import { useMediaStream, type MediaPermissionError } from './use-media-stream'
import { useSessionRecording } from './use-session-recording'
import { useLiveTranscript } from './use-live-transcript'
import type { ParticipantDeviceState } from './participant-tile'

interface SessionRoomViewProps {
  sessionId: string
  /** Which portal is rendering this room — determines "you"/"other party" labels, back-link target, and the Leave-vs-End-Session action. */
  viewer: 'learner' | 'lecturer'
}

const OTHER_PARTY_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }
const ADDED_PARTICIPANT_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }

const PERMISSION_ERROR_COPY: Record<NonNullable<MediaPermissionError>, string> = {
  camera: 'Camera access was blocked or denied — check your browser\'s site permissions and try again.',
  mic: 'Microphone access was blocked or denied — check your browser\'s site permissions and try again.',
  'screen-share': 'Screen share couldn\'t start — check your browser\'s permissions and try again.',
}

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * The Mock Session Room — one shared component reachable from both
 * /member/sessions/[id]/room and /lecturer/sessions/[id]/room, per the
 * confirmed Phase 3 design. Camera, mic, screen-share, recording, and
 * live captions are all REAL browser APIs (getUserMedia/getDisplayMedia/
 * MediaRecorder/SpeechRecognition) — but only ever for the local user's
 * own stream/speech; raise-hand and hide-self-view stay plain local
 * state. Chat and quick reactions are backed by real per-session stores;
 * added participants genuinely appear as new tiles/list rows (still
 * avatar placeholders — see participant-tile.tsx for why no other
 * participant can ever show real video, audio, or transcript here).
 * Ending the session (lecturer only) genuinely writes COMPLETED back
 * into the shared session-requests store, not just a navigation.
 */
export function SessionRoomView({ sessionId, viewer }: SessionRoomViewProps) {
  const router = useRouter()
  const requests = useSessionRequests()
  const request = requests.find((r) => r.id === sessionId)
  const media = useMediaStream()
  const recording = useSessionRecording()
  const [handRaised, setHandRaised] = useState(false)
  const [hideSelf, setHideSelf] = useState(false)
  const [sidePanelHidden, setSidePanelHidden] = useState(false)
  const [addedNames, setAddedNames] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const backHref = viewer === 'learner' ? '/member/sessions' : '/lecturer/sessions'
  const activeStream = media.presenting ? media.screenStream : media.stream
  const transcript = useLiveTranscript(viewer === 'learner' ? request?.learnerName ?? 'You' : request?.lecturerName ?? 'You')

  if (!request) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Session not found"
        description="This session request doesn't exist."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const youName = viewer === 'learner' ? request.learnerName : request.lecturerName
  const otherName = viewer === 'learner' ? request.lecturerName : request.learnerName
  const isLecturerName = (name: string) => lecturerRoster.some((l) => l.name === name)
  const you: ParticipantDeviceState = { cameraOn: media.cameraOn, micOn: media.micOn, handRaised }

  const handleLeave = () => {
    media.cleanup()
    recording.discard()
    transcript.stop()
    if (viewer === 'lecturer') completeSession(sessionId)
    router.push(backHref)
  }

  const toggleRecording = () => (recording.recording ? recording.stop() : recording.start(activeStream))
  const toggleCaptions = () => (transcript.active ? transcript.stop() : transcript.start())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button
        onClick={() => router.push(backHref)}
        aria-label="Back to my sessions"
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', width: 'fit-content' }}
      >
        <ChevronLeft size={14} /> Back to My Sessions
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <AlertTriangle size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Mock Session Room — your own camera, mic, screen share, recording, and captions are all real browser
          features. Other participants are placeholders only: no signaling backend exists to carry a real peer's
          video, audio, or speech here.
        </p>
      </div>

      {media.error && <RoomErrorBanner message={PERMISSION_ERROR_COPY[media.error]} />}
      {recording.error && (
        <RoomErrorBanner message={recording.error === 'unsupported' ? 'Recording isn\'t supported in this browser.' : 'Couldn\'t start recording — turn on your camera or start presenting first.'} />
      )}

      <div className={`grid grid-cols-1 gap-3 ${sidePanelHidden ? '' : 'lg:grid-cols-[1fr_260px]'}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <VideoTileGrid
              youName={youName}
              youState={you}
              youPresenting={media.presenting}
              youVideoStream={activeStream}
              hideSelf={hideSelf}
              otherName={otherName}
              otherState={OTHER_PARTY_STATE}
              extraParticipants={addedNames.map((name) => ({ name, state: ADDED_PARTICIPANT_STATE }))}
            />
            <ReactionBurst />
            <LiveCaptionOverlay active={transcript.active} caption={transcript.interimCaption} unsupported={transcript.unsupported} />
            {recording.recording && (
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                <Circle size={8} fill="var(--red)" color="var(--red)" /> REC {formatTimer(recording.seconds)}
              </div>
            )}
          </div>
          <ReactionBar sessionId={sessionId} senderName={youName} />
          <ControlBar
            cameraOn={media.cameraOn}
            micOn={media.micOn}
            handRaised={handRaised}
            presenting={media.presenting}
            recording={recording.recording}
            captionsOn={transcript.active}
            hideSelf={hideSelf}
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
            leaveLabel={viewer === 'lecturer' ? 'End Session' : 'Leave'}
          />
        </div>

        {!sidePanelHidden && (
          <SessionSidePanel
            participants={[
              { name: youName, role: viewer === 'learner' ? 'Learner' : 'Lecturer', state: you },
              { name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: OTHER_PARTY_STATE },
              ...addedNames.map((name) => ({
                name, role: (isLecturerName(name) ? 'Lecturer' : 'Learner') as 'Lecturer' | 'Learner', state: ADDED_PARTICIPANT_STATE,
              })),
            ]}
            sessionId={sessionId}
            senderName={youName}
            captionsOn={transcript.active || transcript.entries.length > 0}
            transcriptEntries={transcript.entries}
            transcriptUnsupported={transcript.unsupported}
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
