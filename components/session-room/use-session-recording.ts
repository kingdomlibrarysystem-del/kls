'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export type RecordingError = 'unsupported' | 'failed' | null

/**
 * Real local recording of the local user's OWN active stream (camera, or
 * the screen-share stream while presenting) via the MediaRecorder API —
 * no backend involved, same as use-media-stream.ts's getUserMedia/
 * getDisplayMedia calls. Produces a real downloadable video Blob when
 * stopped, using the same Blob -> object URL -> <a download> pattern as
 * lib/utils.ts's exportToCsv. This can only ever capture the local
 * user's own stream: there is no real peer connection carrying another
 * participant's audio/video into this browser (see participant-tile.tsx),
 * so a recording never contains anyone else's audio or video either.
 */
export function useSessionRecording() {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<RecordingError>(null)

  useEffect(() => {
    if (!recording) return
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [recording])

  const start = useCallback((activeStream: MediaStream | null) => {
    setError(null)
    if (typeof MediaRecorder === 'undefined') {
      setError('unsupported')
      return
    }
    if (!activeStream || activeStream.getTracks().length === 0) {
      setError('failed')
      return
    }
    try {
      chunksRef.current = []
      const recorder = new MediaRecorder(activeStream)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
    } catch {
      setError('failed')
    }
  }, [])

  /** Stops recording and triggers a real download of the captured video — same Blob/object-URL/<a download> pattern as exportToCsv in lib/utils.ts. */
  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder) return
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `session-recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`
      link.click()
      URL.revokeObjectURL(url)
      chunksRef.current = []
    }
    recorder.stop()
    recorderRef.current = null
    setRecording(false)
  }, [])

  /** Stops without triggering a download — used on unmount/leave, where there's no user left to receive the file. */
  const discard = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder) return
    recorder.onstop = null
    if (recorder.state !== 'inactive') recorder.stop()
    recorderRef.current = null
    chunksRef.current = []
    setRecording(false)
  }, [])

  useEffect(() => () => discard(), [discard])

  return { recording, seconds, error, start, stop, discard }
}
