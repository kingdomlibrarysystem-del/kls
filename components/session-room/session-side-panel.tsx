'use client'

import { ParticipantListPanel } from './participant-list-panel'
import { SessionChatPanel } from './session-chat-panel'
import { TranscriptPanel } from './transcript-panel'
import { ActivityLogPanel } from './activity-log-panel'
import type { TranscriptEntry } from './use-live-transcript'
import type { LiveKitDataMessage } from './use-livekit-room'
import type { RoomParticipantEntry } from './build-room-participants'
import type { ActivityEntry } from './use-session-activity'

interface SessionSidePanelProps {
  participants: RoomParticipantEntry[]
  sessionId: string
  senderName: string
  captionsOn: boolean
  transcriptEntries: TranscriptEntry[]
  transcriptUnsupported: boolean
  activityEntries: ActivityEntry[]
  /** Host-only — see ParticipantListPanel's docstring. */
  onRemoveParticipant?: (presenceId: string) => void
  sendLiveKitData?: (message: LiveKitDataMessage) => void
}

/** Groups the room's side column (participants, activity, chat, transcript) — split out of session-room-view.tsx to keep that file under the 200-line cap. */
export function SessionSidePanel({ participants, sessionId, senderName, captionsOn, transcriptEntries, transcriptUnsupported, activityEntries, onRemoveParticipant, sendLiveKitData }: SessionSidePanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ParticipantListPanel participants={participants} onRemove={onRemoveParticipant} />
      <ActivityLogPanel entries={activityEntries} />
      <div style={{ flex: 1, minHeight: 220 }}>
        <SessionChatPanel sessionId={sessionId} senderName={senderName} sendLiveKitData={sendLiveKitData} />
      </div>
      {captionsOn && <TranscriptPanel entries={transcriptEntries} unsupported={transcriptUnsupported} />}
    </div>
  )
}
