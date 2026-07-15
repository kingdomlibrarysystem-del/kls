import { Users, Mic, MicOff, Hand } from 'lucide-react'
import type { ParticipantDeviceState } from './participant-tile'

interface RoomParticipant {
  name: string
  role: 'Lecturer' | 'Learner'
  state: ParticipantDeviceState
}

interface ParticipantListPanelProps {
  participants: RoomParticipant[]
}

/** Real participant list — reflects each participant's actual mic/hand-raised state, not a static roster. */
export function ParticipantListPanel({ participants }: ParticipantListPanelProps) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Users size={13} color="var(--gold)" /> Participants ({participants.length})
      </div>
      <div style={{ padding: '6px 0', maxHeight: 180, overflowY: 'auto' }}>
        {participants.map((p) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', transition: 'background 0.1s' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{p.role}</div>
            </div>
            {p.state.handRaised && <Hand size={13} color="var(--gold)" />}
            {p.state.micOn ? <Mic size={13} color="var(--text-muted)" /> : <MicOff size={13} color="var(--red-light)" />}
          </div>
        ))}
      </div>
    </div>
  )
}
