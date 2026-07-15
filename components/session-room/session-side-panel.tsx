'use client'

import { ParticipantListPanel } from './participant-list-panel'
import { SessionChatPanel } from './session-chat-panel'
import { TranscriptPanel } from './transcript-panel'
import type { ParticipantDeviceState } from './participant-tile'
import type { TranscriptEntry } from './use-live-transcript'

interface RoomParticipant {
  name: string
  role: 'Lecturer' | 'Learner'
  state: ParticipantDeviceState
}

interface SessionSidePanelProps {
  participants: RoomParticipant[]
  sessionId: string
  senderName: string
  captionsOn: boolean
  transcriptEntries: TranscriptEntry[]
  transcriptUnsupported: boolean
}

/** Groups the room's side column (participants, chat, transcript) — split out of session-room-view.tsx to keep that file under the 200-line cap. */
export function SessionSidePanel({ participants, sessionId, senderName, captionsOn, transcriptEntries, transcriptUnsupported }: SessionSidePanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ParticipantListPanel participants={participants} />
      <div style={{ flex: 1, minHeight: 220 }}>
        <SessionChatPanel sessionId={sessionId} senderName={senderName} />
      </div>
      {captionsOn && <TranscriptPanel entries={transcriptEntries} unsupported={transcriptUnsupported} />}
    </div>
  )
}
