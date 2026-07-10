'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, CalendarClock } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useSessionRequests, completeSession } from '@/app/lecturer/_shared/use-session-requests'
import { VideoTileGrid } from './video-tile-grid'
import { ControlBar } from './control-bar'
import { SessionChatPanel } from './session-chat-panel'
import { ParticipantListPanel } from './participant-list-panel'
import type { ParticipantDeviceState } from './participant-tile'

interface SessionRoomViewProps {
  sessionId: string
  /** Which portal is rendering this room — determines "you"/"other party" labels, back-link target, and the Leave-vs-End-Session action. */
  viewer: 'learner' | 'lecturer'
}

const INITIAL_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }
const OTHER_PARTY_STATE: ParticipantDeviceState = { cameraOn: true, micOn: true, handRaised: false }

/**
 * The Mock Session Room — one shared component reachable from both
 * /member/sessions/[id]/room and /lecturer/sessions/[id]/room, per the
 * confirmed Phase 3 design. Every control here is genuinely interactive:
 * camera/mic/raise-hand toggle real local state reflected in the video
 * tile and participant list; chat is backed by a real per-session store;
 * ending the session (lecturer only) genuinely writes COMPLETED back into
 * the shared session-requests store, not just a navigation.
 */
export function SessionRoomView({ sessionId, viewer }: SessionRoomViewProps) {
  const router = useRouter()
  const requests = useSessionRequests()
  const request = requests.find((r) => r.id === sessionId)
  const [you, setYou] = useState<ParticipantDeviceState>(INITIAL_STATE)

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

  const handleLeave = () => {
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
          Mock Session Room — no real audio/video. Camera, mic, and chat below are fully interactive, but no live media stream exists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-3">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <VideoTileGrid youName={youName} youState={you} otherName={otherName} otherState={OTHER_PARTY_STATE} />
          <ControlBar
            cameraOn={you.cameraOn}
            micOn={you.micOn}
            handRaised={you.handRaised}
            onToggleCamera={() => setYou((s) => ({ ...s, cameraOn: !s.cameraOn }))}
            onToggleMic={() => setYou((s) => ({ ...s, micOn: !s.micOn }))}
            onToggleHand={() => setYou((s) => ({ ...s, handRaised: !s.handRaised }))}
            onLeave={handleLeave}
            leaveLabel={viewer === 'lecturer' ? 'End Session' : 'Leave'}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ParticipantListPanel
            participants={[
              { name: youName, role: viewer === 'learner' ? 'Learner' : 'Lecturer', state: you },
              { name: otherName, role: viewer === 'learner' ? 'Lecturer' : 'Learner', state: OTHER_PARTY_STATE },
            ]}
          />
          <div style={{ flex: 1, minHeight: 220 }}>
            <SessionChatPanel sessionId={sessionId} senderName={youName} />
          </div>
        </div>
      </div>
    </div>
  )
}
