'use client'

import { ParticipantListPanel } from './participant-list-panel'
import { SessionChatPanel } from './session-chat-panel'
import { TranscriptPanel } from './transcript-panel'
import type { ParticipantDeviceState } from './participant-tile'
import type { TranscriptEntry } from './use-live-transcript'
import type { LiveKitDataMessage } from './use-livekit-room'

interface RoomParticipant {
  name: string
  role: 'Lecturer' | 'Learner' | 'Admin'
  state: ParticipantDeviceState
  presenceId?: string
}

interface SessionSidePanelProps {
  participants: RoomParticipant[]
  sessionId: string
  senderName: string
  captionsOn: boolean
  transcriptEntries: TranscriptEntry[]
  transcriptUnsupported: boolean
  /** Host-only — see ParticipantListPanel's docstring. */
  onRemoveParticipant?: (presenceId: string) => void
  sendLiveKitData?: (message: LiveKitDataMessage) => void
}

/** Groups the room's side column (participants, chat, transcript) — split out of session-room-view.tsx to keep that file under the 200-line cap. */
export function SessionSidePanel({ participants, sessionId, senderName, captionsOn, transcriptEntries, transcriptUnsupported, onRemoveParticipant, sendLiveKitData }: SessionSidePanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ParticipantListPanel participants={participants} onRemove={onRemoveParticipant} />
      <div style={{ flex: 1, minHeight: 220 }}>
        <SessionChatPanel sessionId={sessionId} senderName={senderName} sendLiveKitData={sendLiveKitData} />
      </div>
      {captionsOn && <TranscriptPanel entries={transcriptEntries} unsupported={transcriptUnsupported} />}
    </div>
  )
}
