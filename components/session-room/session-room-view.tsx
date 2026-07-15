'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, CalendarClock, AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests, completeSession } from '@/app/lecturer/_shared/use-session-requests'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'
import { VideoTileGrid } from './video-tile-grid'
import { ControlBar } from './control-bar'
import { SessionChatPanel } from './session-chat-panel'
import { ParticipantListPanel } from './participant-list-panel'
import { AddParticipantModal } from './add-participant-modal'
import { ReactionBar } from './reaction-bar'
import { ReactionBurst } from './reaction-burst'
import { useMediaStream, type MediaPermissionError } from './use-media-stream'
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

/**
 * The Mock Session Room — one shared component reachable from both
 * /member/sessions/[id]/room and /lecturer/sessions/[id]/room, per the
 * confirmed Phase 3 design. Camera, mic, and screen-share are REAL
 * browser media (getUserMedia/getDisplayMedia via use-media-stream.ts) —
 * only for the local user's own tile; raise-hand stays plain local
 * state. Chat and quick reactions are backed by real per-session stores;
 * added participants genuinely appear as new tiles/list rows (still
 * avatar placeholders — see participant-tile.tsx for why no other
 * participant can ever show real video here). Ending the session
 * (lecturer only) genuinely writes COMPLETED back into the shared
 * session-requests store, not just a navigation.
 */
export function SessionRoomView({ sessionId, viewer }: SessionRoomViewProps) {
  const router = useRouter()
  const requests = useSessionRequests()
  const request = requests.find((r) => r.id === sessionId)
  const media = useMediaStream()
  const [handRaised, setHandRaised] = useState(false)
  const [addedNames, setAddedNames] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)

  const backHref = viewer === 'learner' ? '/member/sessions' : '/lecturer/sessions'

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
    if (viewer === 'lecturer') completeSession(sessionId)
    router.push(backHref)
  }

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
          Mock Session Room — your own camera, mic, and screen share are real browser media. Other participants are
          placeholders only: this mock has no signaling backend to carry a real peer's video here.
        </p>
      </div>

      {media.error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-dim)', color: 'var(--red-light)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {PERMISSION_ERROR_COPY[media.error]}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <VideoTileGrid
              youName={youName}
              youState={you}
              youPresenting={media.presenting}
              youVideoStream={media.presenting ? media.screenStream : media.stream}
              otherName={otherName}
              otherState={OTHER_PARTY_STATE}
              extraParticipants={addedNames.map((name) => ({ name, state: ADDED_PARTICIPANT_STATE }))}
            />
            <ReactionBurst />
          </div>
          <ReactionBar sessionId={sessionId} senderName={youName} />
          <ControlBar
            cameraOn={media.cameraOn}
            micOn={media.micOn}
            handRaised={handRaised}
            presenting={media.presenting}
            onToggleCamera={media.toggleCamera}
            onToggleMic={media.toggleMic}
            onToggleHand={() => setHandRaised((h) => !h)}
            onTogglePresenting={media.togglePresenting}
            onAddParticipant={() => setAddOpen(true)}
            onLeave={handleLeave}
            leaveLabel={viewer === 'lecturer' ? 'End Session' : 'Leave'}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ParticipantListPanel
            participants={[
              { name: youName, role: viewer === 'learner' ? 'Learner' : 'Lecturer', state: you },
              { name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: OTHER_PARTY_STATE },
              ...addedNames.map((name) => ({
                name, role: (isLecturerName(name) ? 'Lecturer' : 'Learner') as 'Lecturer' | 'Learner', state: ADDED_PARTICIPANT_STATE,
              })),
            ]}
          />
          <div style={{ flex: 1, minHeight: 220 }}>
            <SessionChatPanel sessionId={sessionId} senderName={youName} />
          </div>
        </div>
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
