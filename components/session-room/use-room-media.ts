'use client'

import { useMediaStream } from './use-media-stream'
import { useLiveKitRoom, type LiveKitDataMessage } from './use-livekit-room'

interface UseRoomMediaInput {
  sessionId: string
  displayName: string
  enabled: boolean
  onData: (message: LiveKitDataMessage) => void
}

/**
 * Picks between a real LiveKit connection and the local-only mock,
 * exposing one unified media interface either way — session-room-view.tsx
 * doesn't need to branch on which backend is active for camera/mic/
 * screen-share toggles, only for the extra LiveKit-specific fields
 * (remote tracks, sendData) it still reads directly off `liveKit`.
 */
export function useRoomMedia({ sessionId, displayName, enabled, onData }: UseRoomMediaInput) {
  const liveKit = useLiveKitRoom({ sessionId, displayName, enabled, onData })
  const mockMedia = useMediaStream()
  const ready = liveKit.connected && !liveKit.connectError

  const media = ready
    ? {
        stream: null as MediaStream | null, screenStream: null as MediaStream | null,
        cameraOn: liveKit.cameraOn, micOn: liveKit.micOn, presenting: liveKit.presenting, error: null,
        toggleCamera: liveKit.toggleCamera, toggleMic: liveKit.toggleMic, togglePresenting: liveKit.togglePresenting, cleanup: liveKit.cleanup,
      }
    : mockMedia

  const activeLiveKitTrack = media.presenting ? liveKit.localScreenTrack : liveKit.localVideoTrack
  const recordingStream = ready
    ? (activeLiveKitTrack ? new MediaStream([activeLiveKitTrack.mediaStreamTrack]) : null)
    : (media.presenting ? media.screenStream : media.stream)

  return { liveKit, mockMedia, media, ready, recordingStream }
}
