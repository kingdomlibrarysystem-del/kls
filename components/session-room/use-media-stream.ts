'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export type MediaPermissionError = 'camera' | 'mic' | 'screen-share' | null

/**
 * Real browser media control for the current user's own tile — camera and
 * mic each get their own getUserMedia track so toggling one never
 * disturbs the other; screen share uses getDisplayMedia. All local
 * browser APIs; no signaling/TURN backend is needed for the local user's
 * own stream to render in their own tile. Intentionally a plain hook
 * (useState/useRef), not a useSyncExternalStore module store — a
 * MediaStream and its tracks are ephemeral, per-component-instance
 * browser resources tied to this one room session, not shared app state
 * another component needs to read, so the shared-store pattern used
 * elsewhere in this app doesn't fit here.
 */
export function useMediaStream() {
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [error, setError] = useState<MediaPermissionError>(null)
  /** The composed stream rendered in the local user's <video> element — rebuilt from whichever real tracks are currently live. */
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  const rebuildStream = useCallback(() => {
    const tracks = [videoTrackRef.current, audioTrackRef.current].filter((t): t is MediaStreamTrack => !!t)
    setStream(tracks.length ? new MediaStream(tracks) : null)
  }, [])

  const toggleCamera = useCallback(async () => {
    setError(null)
    if (cameraOn) {
      videoTrackRef.current?.stop()
      videoTrackRef.current = null
      setCameraOn(false)
      rebuildStream()
      return
    }
    try {
      const captured = await navigator.mediaDevices.getUserMedia({ video: true })
      videoTrackRef.current = captured.getVideoTracks()[0] ?? null
      setCameraOn(true)
      rebuildStream()
    } catch {
      setError('camera')
    }
  }, [cameraOn, rebuildStream])

  const toggleMic = useCallback(async () => {
    setError(null)
    if (micOn) {
      // Real mute: keep the track alive but disabled, matching how mute genuinely works in real conferencing apps (vs. stopping the track, which would require re-prompting for permission to unmute).
      if (audioTrackRef.current) audioTrackRef.current.enabled = false
      setMicOn(false)
      return
    }
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.enabled = true
      } else {
        const captured = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioTrackRef.current = captured.getAudioTracks()[0] ?? null
        rebuildStream()
      }
      setMicOn(true)
    } catch {
      setError('mic')
    }
  }, [micOn, rebuildStream])

  const togglePresenting = useCallback(async () => {
    setError(null)
    if (presenting) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
      setScreenStream(null)
      setPresenting(false)
      return
    }
    try {
      const captured = await navigator.mediaDevices.getDisplayMedia({ video: true })
      // The user can stop sharing via the browser's own "Stop sharing" bar, not just our button — reflect that back into our state.
      captured.getVideoTracks()[0]?.addEventListener('ended', () => {
        screenStreamRef.current = null
        setScreenStream(null)
        setPresenting(false)
      })
      screenStreamRef.current = captured
      setScreenStream(captured)
      setPresenting(true)
    } catch (err) {
      // AbortError/NotAllowedError both fire when the user cancels the OS/browser share picker — not a real error to surface.
      if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError')) return
      setError('screen-share')
    }
  }, [presenting])

  const cleanup = useCallback(() => {
    videoTrackRef.current?.stop()
    audioTrackRef.current?.stop()
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    videoTrackRef.current = null
    audioTrackRef.current = null
    screenStreamRef.current = null
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  return { stream, screenStream, cameraOn, micOn, presenting, error, toggleCamera, toggleMic, togglePresenting, cleanup }
}
