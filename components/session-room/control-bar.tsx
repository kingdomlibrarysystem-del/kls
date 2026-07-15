import { Video, VideoOff, Mic, MicOff, Hand, PhoneOff, ScreenShare, ScreenShareOff, UserPlus } from 'lucide-react'

interface ControlBarProps {
  cameraOn: boolean
  micOn: boolean
  handRaised: boolean
  presenting: boolean
  onToggleCamera: () => void
  onToggleMic: () => void
  onToggleHand: () => void
  onTogglePresenting: () => void
  onAddParticipant: () => void
  onLeave: () => void
  /** "End Session" for the lecturer (also marks the request COMPLETED), "Leave" for the learner. */
  leaveLabel: string
}

function ControlButton({
  active, onClick, activeIcon, inactiveIcon, label,
}: {
  active: boolean
  onClick: () => void
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      style={{
        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--bg-section)' : 'var(--red-dim)',
        color: active ? 'var(--text-primary)' : 'var(--red-light)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  )
}

/** Real, stateful controls — every button here reflects and mutates genuine room state, nothing decorative. */
export function ControlBar({ cameraOn, micOn, handRaised, presenting, onToggleCamera, onToggleMic, onToggleHand, onTogglePresenting, onAddParticipant, onLeave, leaveLabel }: ControlBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 0', flexWrap: 'wrap' }}>
      <ControlButton
        active={micOn}
        onClick={onToggleMic}
        activeIcon={<Mic size={18} />}
        inactiveIcon={<MicOff size={18} />}
        label={micOn ? 'Mute microphone' : 'Unmute microphone'}
      />
      <ControlButton
        active={cameraOn}
        onClick={onToggleCamera}
        activeIcon={<Video size={18} />}
        inactiveIcon={<VideoOff size={18} />}
        label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
      />
      <button
        onClick={onToggleHand}
        aria-pressed={handRaised}
        aria-label={handRaised ? 'Lower hand' : 'Raise hand'}
        style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: handRaised ? 'var(--gold)' : 'var(--bg-section)',
          color: handRaised ? '#fff' : 'var(--text-primary)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        <Hand size={18} />
      </button>
      <button
        onClick={onTogglePresenting}
        aria-pressed={presenting}
        aria-label={presenting ? 'Stop presenting' : 'Start presenting (mock — no real screen capture)'}
        style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: presenting ? 'var(--teal-light)' : 'var(--bg-section)',
          color: presenting ? '#fff' : 'var(--text-primary)',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {presenting ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
      </button>
      <button
        onClick={onAddParticipant}
        aria-label="Add a participant"
        style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-section)', color: 'var(--text-primary)',
        }}
      >
        <UserPlus size={18} />
      </button>
      <button
        onClick={onLeave}
        aria-label={leaveLabel}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 22, border: 'none',
          background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <PhoneOff size={16} /> {leaveLabel}
      </button>
    </div>
  )
}
