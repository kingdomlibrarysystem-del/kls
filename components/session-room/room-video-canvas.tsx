import { Circle } from 'lucide-react'
import type { Track } from 'livekit-client'
import { VideoTileGrid, type ExtraParticipant } from './video-tile-grid'
import { ReactionBar } from './reaction-bar'
import { ReactionBurst } from './reaction-burst'
import { LiveCaptionOverlay } from './live-caption-overlay'
import { ControlBar } from './control-bar'
import { formatTimer } from './room-error-banner'
import type { ParticipantDeviceState } from './participant-tile'
import type { LiveKitDataMessage } from './use-livekit-room'

interface RoomVideoCanvasProps {
  sessionId: string
  youName: string
  you: ParticipantDeviceState
  youPresenting: boolean
  youVideoStream?: MediaStream | null
  youCameraTrack?: Track | null
  hideSelf: boolean
  otherName: string
  otherState: ParticipantDeviceState
  otherNotJoined: boolean
  otherCameraTrack?: Track | null
  otherMicTrack?: Track | null
  otherScreenTrack?: Track | null
  extraParticipants: ExtraParticipant[]
  transcriptActive: boolean
  interimCaption: string
  captionsUnsupported: boolean
  recording: boolean
  recordingSeconds: number
  handRaised: boolean
  sidePanelHidden: boolean
  onToggleCamera: () => void
  onToggleMic: () => void
  onToggleHand: () => void
  onTogglePresenting: () => void
  onToggleRecording: () => void
  onToggleCaptions: () => void
  onToggleHideSelf: () => void
  onToggleSidePanel: () => void
  onAddParticipant: () => void
  onLeave: () => void
  leaveLabel: string
  sendLiveKitData?: (message: LiveKitDataMessage) => void
}

/**
 * The video canvas: tile grid, reaction/caption overlays, and the
 * Meet-style control chrome docked to its bottom edge — split out of
 * session-room-view.tsx to keep that file under the 200-line cap.
 */
export function RoomVideoCanvas({
  sessionId, youName, you, youPresenting, youVideoStream, youCameraTrack, hideSelf, otherName, otherState, otherNotJoined,
  otherCameraTrack, otherMicTrack, otherScreenTrack, extraParticipants, transcriptActive, interimCaption, captionsUnsupported, recording, recordingSeconds,
  handRaised, sidePanelHidden, onToggleCamera, onToggleMic, onToggleHand, onTogglePresenting, onToggleRecording,
  onToggleCaptions, onToggleHideSelf, onToggleSidePanel, onAddParticipant, onLeave, leaveLabel, sendLiveKitData,
}: RoomVideoCanvasProps) {
  return (
    <div style={{ position: 'relative', minHeight: 520, borderRadius: 14, overflow: 'hidden', background: 'var(--bg-dashboard)' }}>
      <VideoTileGrid
        youName={youName}
        youState={you}
        youPresenting={youPresenting}
        youVideoStream={youVideoStream}
        youCameraTrack={youCameraTrack}
        hideSelf={hideSelf}
        otherName={otherName}
        otherState={otherState}
        otherNotJoined={otherNotJoined}
        otherCameraTrack={otherCameraTrack}
        otherMicTrack={otherMicTrack}
        otherScreenTrack={otherScreenTrack}
        extraParticipants={extraParticipants}
      />
      <ReactionBurst />
      <LiveCaptionOverlay active={transcriptActive} caption={interimCaption} unsupported={captionsUnsupported} />
      {recording && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
          <Circle size={8} fill="var(--red)" color="var(--red)" /> REC {formatTimer(recordingSeconds)}
        </div>
      )}

      {/* Floating control chrome, docked to the bottom of the video canvas (Meet-style) instead of sitting in-flow below it. */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '10px 12px 14px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)',
        }}
      >
        <ReactionBar sessionId={sessionId} senderName={youName} sendLiveKitData={sendLiveKitData} />
        <ControlBar
          cameraOn={you.cameraOn}
          micOn={you.micOn}
          handRaised={handRaised}
          presenting={youPresenting}
          recording={recording}
          captionsOn={transcriptActive}
          hideSelf={hideSelf}
          sidePanelHidden={sidePanelHidden}
          onToggleCamera={onToggleCamera}
          onToggleMic={onToggleMic}
          onToggleHand={onToggleHand}
          onTogglePresenting={onTogglePresenting}
          onToggleRecording={onToggleRecording}
          onToggleCaptions={onToggleCaptions}
          onToggleHideSelf={onToggleHideSelf}
          onToggleSidePanel={onToggleSidePanel}
          onAddParticipant={onAddParticipant}
          onLeave={onLeave}
          leaveLabel={leaveLabel}
        />
      </div>
    </div>
  )
}
