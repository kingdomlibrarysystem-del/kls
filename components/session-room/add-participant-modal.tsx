'use client'

import { UserPlus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { lecturerRoster } from '@/app/lecturer/_components/lecturer-identity'

/**
 * Other named personas already established elsewhere in this app (seeded
 * learners from session-requests-data.ts, reused across many mock
 * datasets — audit-log, certificates, enrollments, etc.) — reused here
 * rather than inventing new names for the picker pool.
 */
const KNOWN_LEARNERS = ['Amina Uwimana', 'Patrick Iradukunda', 'Claudine Ingabire', 'Sarah Uwase']
const KNOWN_PEOPLE = [...lecturerRoster.map((l) => l.name), ...KNOWN_LEARNERS]

interface AddParticipantModalProps {
  open: boolean
  onClose: () => void
  /** Names already in the room — excluded from the pickable list. */
  excludeNames: string[]
  onAdd: (name: string) => void
}

/** Lets the current user add another known persona to the room — a real addition to VideoTileGrid/ParticipantListPanel, not just a shareable link. */
export function AddParticipantModal({ open, onClose, excludeNames, onAdd }: AddParticipantModalProps) {
  const available = KNOWN_PEOPLE.filter((name) => !excludeNames.includes(name))

  return (
    <Modal open={open} onClose={onClose} title="Add a Participant" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Add another person from this Kingdom Library community into the room.
        </p>
        {available.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Everyone available has already been added.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {available.map((name) => (
              <button
                key={name}
                onClick={() => { onAdd(name); onClose() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <UserPlus size={14} color="var(--gold)" /> {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
