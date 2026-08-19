'use client'

import { useEffect, useRef } from 'react'
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
  /**
   * Real local-state toggle backed by an actual getDisplayMedia capture
   * (see use-media-stream.ts) — only ever set for the local "you" tile.
   */
  presenting?: boolean
  /**
   * A REAL local MediaStream (camera or screen-share) to render via
   * <video>, only ever provided for the local "you" tile — see
   * use-media-stream.ts. Other participants (John Doe, anyone added via
   * AddParticipantModal) NEVER receive a real video stream here: this
   * mock has no signaling/TURN backend, so there is no real peer
   * connection to carry another person's camera into this browser.
   * Their tiles intentionally stay the initials-avatar placeholder below
   * — showing a stock photo/video loop for them would misrepresent a
   * fake feed as a real one, which is the dishonest gap this project has
   * been removing elsewhere.
   */
  videoStream?: MediaStream | null
  /**
   * True when this participant was invited (learner/lecturer on the
   * SessionRequest, or a name added via AddParticipantModal) but has no
   * live SessionPresence row — i.e. they haven't actually opened the
   * room. Previously this tile always showed a fake always-connected
   * camera-on state regardless of whether anyone was really there; now
   * an uninvited-but-not-joined tile shows a real "Waiting to join…"
   * placeholder instead.
   */
  notJoined?: boolean
}

/**
 * One video tile. For the local "you" tile with an active camera or
 * screen-share, renders a REAL <video> element bound to the actual
 * MediaStream. Every other tile (including "you" with the camera off)
 * falls back to the initials-avatar placeholder — this is the mock
 * room's one honest, explained limitation: no other participant can ever
 * show real video here (see videoStream's docstring).
 */
export function ParticipantTile({ name, isYou, state, presenting, videoStream, notJoined }: ParticipantTileProps) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = videoStream ?? null
  }, [videoStream])

  const showRealVideo = isYou && !!videoStream

  return (
    <div
      style={{
        position: 'relative', minHeight: 140, height: '100%', borderRadius: 10, overflow: 'hidden',
        background: presenting ? 'linear-gradient(135deg, var(--gold-dim), var(--bg-card))' : 'linear-gradient(135deg, var(--bg-section), var(--bg-card))',
        border: presenting ? '2px solid var(--teal-light)' : isYou ? '2px solid var(--gold)' : '1px solid var(--border)',
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
          <Clock size={22} />
          <span style={{ fontSize: 10 }}>Waiting to join…</span>
        </div>
      ) : showRealVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isYou}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: presenting ? 'none' : 'scaleX(-1)' }}
        />
      ) : state.cameraOn ? (
        // isYou + cameraOn with no resolved stream yet means the permission prompt is still pending — hold the avatar rather than a blank frame.
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
          {initials}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <VideoOff size={24} />
          <span style={{ fontSize: 10 }}>Camera off</span>
        </div>
      )}

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
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '6px 10px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.55), transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{name}{isYou ? ' (You)' : ''}</span>
        {!notJoined && (
          <div style={{ display: 'flex', gap: 4 }}>
            {state.micOn ? <Mic size={13} color="#fff" /> : <MicOff size={13} color="var(--red-light)" />}
            {!state.cameraOn && <VideoOff size={13} color="var(--red-light)" />}
          </div>
        )}
      </div>
    </div>
  )
}
