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

export interface RoomVideoCanvasYou {
  name: string
  state: ParticipantDeviceState
  presenting: boolean
  videoStream?: MediaStream | null
  cameraTrack?: Track | null
  handRaised: boolean
}

export interface RoomVideoCanvasOther {
  name: string
  state: ParticipantDeviceState
  notJoined: boolean
  cameraTrack?: Track | null
  micTrack?: Track | null
  screenTrack?: Track | null
}

export interface RoomVideoCanvasControls {
  hideSelf: boolean
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
}

interface RoomVideoCanvasProps {
  sessionId: string
  you: RoomVideoCanvasYou
  other: RoomVideoCanvasOther
  extraParticipants: ExtraParticipant[]
  transcriptActive: boolean
  interimCaption: string
  captionsUnsupported: boolean
  recording: boolean
  recordingSeconds: number
  controls: RoomVideoCanvasControls
  sendLiveKitData?: (message: LiveKitDataMessage) => void
  onReact?: (emoji: string) => void
}

/**
 * The video canvas: tile grid, reaction/caption overlays, and the
 * Meet-style control chrome docked to its bottom edge — split out of
 * session-room-view.tsx to keep that file under the 200-line cap.
 */
export function RoomVideoCanvas({
  sessionId, you, other, extraParticipants, transcriptActive, interimCaption, captionsUnsupported, recording, recordingSeconds,
  controls, sendLiveKitData, onReact,
}: RoomVideoCanvasProps) {
  return (
    <div style={{ position: 'relative', minHeight: 520, borderRadius: 14, overflow: 'hidden', background: 'var(--bg-dashboard)' }}>
      <VideoTileGrid
        youName={you.name}
        youState={you.state}
        youPresenting={you.presenting}
        youVideoStream={you.videoStream}
        youCameraTrack={you.cameraTrack}
        hideSelf={controls.hideSelf}
        otherName={other.name}
        otherState={other.state}
        otherNotJoined={other.notJoined}
        otherCameraTrack={other.cameraTrack}
        otherMicTrack={other.micTrack}
        otherScreenTrack={other.screenTrack}
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
        <ReactionBar sessionId={sessionId} senderName={you.name} sendLiveKitData={sendLiveKitData} onReact={onReact} />
        <ControlBar
          cameraOn={you.state.cameraOn}
          micOn={you.state.micOn}
          handRaised={you.handRaised}
          presenting={you.presenting}
          recording={recording}
          captionsOn={transcriptActive}
          hideSelf={controls.hideSelf}
          sidePanelHidden={controls.sidePanelHidden}
          onToggleCamera={controls.onToggleCamera}
          onToggleMic={controls.onToggleMic}
          onToggleHand={controls.onToggleHand}
          onTogglePresenting={controls.onTogglePresenting}
          onToggleRecording={controls.onToggleRecording}
          onToggleCaptions={controls.onToggleCaptions}
          onToggleHideSelf={controls.onToggleHideSelf}
          onToggleSidePanel={controls.onToggleSidePanel}
          onAddParticipant={controls.onAddParticipant}
          onLeave={controls.onLeave}
          leaveLabel={controls.leaveLabel}
        />
      </div>
    </div>
  )
}
