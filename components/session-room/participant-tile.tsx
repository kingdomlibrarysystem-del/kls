import { VideoOff, Mic, MicOff, Hand } from 'lucide-react'

export interface ParticipantDeviceState {
  cameraOn: boolean
  micOn: boolean
  handRaised: boolean
}

interface ParticipantTileProps {
  name: string
  isYou: boolean
  state: ParticipantDeviceState
}

/**
 * One video tile: initials avatar (never a real camera feed — this is a
 * mock room), name, and live camera/mic/raise-hand indicators reflecting
 * that participant's actual toggled state. The "you" tile gets a visually
 * distinct gold border so it's obvious which tile is controllable.
 */
export function ParticipantTile({ name, isYou, state }: ParticipantTileProps) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      style={{
        position: 'relative', aspectRatio: '16/10', borderRadius: 10, overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--bg-section), var(--bg-card))',
        border: isYou ? '2px solid var(--gold)' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {state.cameraOn ? (
        <div
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: '#fff',
          }}
        >
          {initials}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
          <VideoOff size={24} />
          <span style={{ fontSize: 10 }}>Camera off</span>
        </div>
      )}

      {state.handRaised && (
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
        <div style={{ display: 'flex', gap: 4 }}>
          {state.micOn ? <Mic size={13} color="#fff" /> : <MicOff size={13} color="var(--red-light)" />}
          {!state.cameraOn && <VideoOff size={13} color="var(--red-light)" />}
        </div>
      </div>
    </div>
  )
}
