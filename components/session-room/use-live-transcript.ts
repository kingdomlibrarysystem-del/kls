'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  at: string
}

/**
 * Minimal ambient typing for the Web Speech API's SpeechRecognition —
 * not in TypeScript's default DOM lib (still non-standard/vendor-
 * prefixed), so declared locally rather than pulling in a @types
 * package for a handful of fields this hook actually uses.
 */
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => SpeechRecognitionLike) | null ?? null
}

/**
 * Real live speech-to-text for the LOCAL user's own microphone only, via
 * the Web Speech API — Chrome/Edge only (no Firefox/Safari support as of
 * this writing), surfaced explicitly via `supported` rather than failing
 * silently. This can only ever transcribe the local user's own speech:
 * there is no real peer audio stream to feed into SpeechRecognition
 * either, for the exact same reason recording can't capture it (see
 * use-session-recording.ts) — no signaling backend carries another
 * participant's audio into this browser.
 */
export function useLiveTranscript(speakerName: string) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [active, setActive] = useState(false)
  const [interimCaption, setInterimCaption] = useState('')
  const [entries, setEntries] = useState<TranscriptEntry[]>([])
  const [unsupported, setUnsupported] = useState(false)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setActive(false)
    setInterimCaption('')
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setUnsupported(true)
      return
    }
    setUnsupported(false)
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          setEntries((prev) => [...prev, { id: `${Date.now()}-${i}`, speaker: speakerName, text: text.trim(), at: new Date().toISOString() }])
        } else {
          interim += text
        }
      }
      setInterimCaption(interim)
    }
    recognition.onerror = () => stop()
    recognition.onend = () => setActive(false)

    recognition.start()
    recognitionRef.current = recognition
    setActive(true)
  }, [speakerName, stop])

  useEffect(() => () => stop(), [stop])

  return { active, interimCaption, entries, unsupported, start, stop }
}
