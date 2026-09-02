'use client'

import { useEffect, useRef } from 'react'
import type { Track } from 'livekit-client'
import { VideoOff, Mic, MicOff, Hand, ScreenShare, Clock } from 'lucide-react'

export interface ParticipantDeviceState {
  cameraOn: boolean
  micOn: boolean
  handRaised: boolean
}

interface ParticipantTileProps {
  name: string
  isYou: boolean
  state: ParticipantDeviceState
  /** Real local-state toggle, true while presenting (local or remote). */
  presenting?: boolean
  /**
   * A REAL local MediaStream (camera or screen-share) for the local
   * user's own tile when LiveKit isn't configured (mock fallback) — see
   * use-media-stream.ts.
   */
  videoStream?: MediaStream | null
  /**
   * A REAL LiveKit Track — local (this browser's own camera/screen,
   * published to the room) or remote (another participant's actual
   * camera/screen, received over a real WebRTC subscription). Takes
   * precedence over videoStream when both are absent/present; attached
   * via track.attach() (LiveKit's own recommended API) rather than
   * reading .mediaStreamTrack into a MediaStream by hand.
   */
  liveKitTrack?: Track | null
  /**
   * True when this participant was invited (learner/lecturer on the
   * SessionRequest, or a name added via AddParticipantModal) but has no
   * live SessionPresence row — i.e. they haven't actually opened the
   * room.
   */
  notJoined?: boolean
  /** Fills the entire available space with a larger avatar/video — used for the single "you're the only one here" layout. */
  solo?: boolean
}

/**
 * One video tile. Renders a REAL <video>/<audio> element bound to an
 * actual media track — either a local MediaStream (mock fallback) or a
 * real LiveKit Track (local or a genuinely remote participant's own
 * camera/screen, received over WebRTC). Falls back to an initials
 * avatar only when no real track exists yet (camera off, or LiveKit not
 * configured for this environment).
 */
export function ParticipantTile({ name, isYou, state, presenting, videoStream, liveKitTrack, notJoined, solo }: ParticipantTileProps) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (videoStream && videoRef.current) videoRef.current.srcObject = videoStream
  }, [videoStream])

  useEffect(() => {
    if (!liveKitTrack) return
    const el = liveKitTrack.kind === 'audio' ? audioRef.current : videoRef.current
    if (!el) return
    liveKitTrack.attach(el)
    return () => { liveKitTrack.detach(el) }
  }, [liveKitTrack])

  const showRealVideo = !!videoStream || (!!liveKitTrack && liveKitTrack.kind === 'video')

  return (
    <div
      style={{
        position: 'relative', minHeight: solo ? undefined : 140, height: '100%', width: '100%', borderRadius: solo ? 0 : 10, overflow: 'hidden',
        background: presenting ? 'linear-gradient(135deg, var(--gold-dim), var(--bg-card))' : 'linear-gradient(135deg, var(--bg-section), var(--bg-card))',
        border: solo ? 'none' : presenting ? '2px solid var(--teal-light)' : isYou ? '2px solid var(--gold)' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.15s',
      }}
    >
      {presenting && (
        <div
          style={{
            position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 4,
            background: 'var(--teal-light)', color: '#fff', fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 6, zIndex: 1,
          }}
        >
          <ScreenShare size={11} /> Presenting
        </div>
      )}

      {notJoined ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <Clock size={solo ? 32 : 22} />
          <span style={{ fontSize: solo ? 13 : 10 }}>Waiting to join…</span>
        </div>
      ) : showRealVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isYou}
          // A <video> with no source paints solid black by default — matching
          // background to the tile's own placeholder gradient avoids a black
          // flash between this element mounting and its track actually
          // attaching (a separate effect below, so there's always a one-paint
          // gap between the two).
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'linear-gradient(135deg, var(--bg-section), var(--bg-card))', transform: presenting ? 'none' : isYou ? 'scaleX(-1)' : 'none' }}
        />
      ) : state.cameraOn ? (
        // isYou + cameraOn with no resolved track yet means the permission prompt is still pending — hold the avatar rather than a blank frame.
        <div style={{ width: solo ? 96 : 64, height: solo ? 96 : 64, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: solo ? 32 : 22, fontWeight: 700, color: '#fff' }}>
          {initials}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <VideoOff size={solo ? 32 : 24} />
          <span style={{ fontSize: solo ? 13 : 10 }}>Camera off</span>
        </div>
      )}

      {liveKitTrack?.kind === 'audio' && <audio ref={audioRef} autoPlay />}

      {!notJoined && state.handRaised && (
        <div
          style={{
            position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%',
            background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label={`${name} raised their hand`}
        >
          <Hand size={13} color="#fff" />
        </div>
      )}

      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: solo ? '10px 16px' : '6px 10px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.55), transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: solo ? 14 : 11, fontWeight: 600, color: '#fff' }}>{name}{isYou ? ' (You)' : ''}</span>
        {!notJoined && (
          <div style={{ display: 'flex', gap: 4 }}>
            {state.micOn ? <Mic size={solo ? 15 : 13} color="#fff" /> : <MicOff size={solo ? 15 : 13} color="var(--red-light)" />}
            {!state.cameraOn && <VideoOff size={solo ? 15 : 13} color="var(--red-light)" />}
          </div>
        )}
      </div>
    </div>
  )
}
