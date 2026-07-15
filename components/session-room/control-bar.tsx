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

interface CircleButtonProps {
  /** True = the device/feature is on (mic unmuted, camera on) and gets the neutral background; false = off/muted and gets the red "needs attention" background — same meaning as the original inline buttons this replaces. */
  on: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  /** Third visual state (raise-hand gold, presenting teal) that overrides the on/off red-vs-neutral coloring entirely. */
  highlightColor?: string
  highlighted?: boolean
}

/** One round control button — on/off/highlighted coloring plus a real hover state, shared by mic/camera/hand/presenting/add-participant. */
function CircleButton({ on, onClick, icon, label, highlightColor, highlighted }: CircleButtonProps) {
  const background = highlighted ? highlightColor : on ? 'var(--bg-section)' : 'var(--red-dim)'
  const color = highlighted ? '#fff' : on ? 'var(--text-primary)' : 'var(--red-light)'
  return (
    <button
      onClick={onClick}
      aria-pressed={highlighted ?? !on}
      aria-label={label}
      className="hover:brightness-95 active:scale-95"
      style={{
        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background, color, transition: 'background 0.15s, color 0.15s, transform 0.1s',
      }}
    >
      {icon}
    </button>
  )
}

/** Real, stateful controls — every button here reflects and mutates genuine room state, nothing decorative. Wraps onto a second row on narrow viewports rather than overflowing. */
export function ControlBar({ cameraOn, micOn, handRaised, presenting, onToggleCamera, onToggleMic, onToggleHand, onTogglePresenting, onAddParticipant, onLeave, leaveLabel }: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3" style={{ padding: '12px 0' }}>
      <CircleButton
        on={micOn}
        onClick={onToggleMic}
        icon={micOn ? <Mic size={18} /> : <MicOff size={18} />}
        label={micOn ? 'Mute microphone' : 'Unmute microphone'}
      />
      <CircleButton
        on={cameraOn}
        onClick={onToggleCamera}
        icon={cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
        label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
      />
      <CircleButton
        on
        highlighted={handRaised}
        highlightColor="var(--gold)"
        onClick={onToggleHand}
        icon={<Hand size={18} />}
        label={handRaised ? 'Lower hand' : 'Raise hand'}
      />
      <CircleButton
        on
        highlighted={presenting}
        highlightColor="var(--teal-light)"
        onClick={onTogglePresenting}
        icon={presenting ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
        label={presenting ? 'Stop presenting' : 'Start presenting — shares your real screen'}
      />
      <CircleButton
        on
        onClick={onAddParticipant}
        icon={<UserPlus size={18} />}
        label="Add a participant"
      />
      <button
        onClick={onLeave}
        aria-label={leaveLabel}
        className="hover:brightness-90 active:scale-95"
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 22, border: 'none',
          background: 'var(--red)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'transform 0.1s',
        }}
      >
        <PhoneOff size={16} /> {leaveLabel}
      </button>
    </div>
  )
}
