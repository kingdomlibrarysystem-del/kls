'use client'

import { useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
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
  /** Names already in the room — shown grayed-out/disabled rather than silently omitted, for clearer feedback than a vanishing row. */
  excludeNames: string[]
  onAdd: (name: string) => void
}

function initialsOf(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

/** Lets the current user add another known persona to the room — a real addition to VideoTileGrid/ParticipantListPanel, not just a shareable link. Searchable, with avatar circles matching the tiles/list elsewhere in this room. */
export function AddParticipantModal({ open, onClose, excludeNames, onAdd }: AddParticipantModalProps) {
  const [search, setSearch] = useState('')
  const filtered = KNOWN_PEOPLE.filter((name) => name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal open={open} onClose={onClose} title="Add a Participant" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Add another person from this Kingdom Library community into the room.
        </p>

        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            aria-label="Search people to add"
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8,
              fontSize: 12, borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg-section)', color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matches" description="Try a different search term." style={{ padding: '16px 8px', color: 'var(--text-secondary)' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
            {filtered.map((name) => {
              const already = excludeNames.includes(name)
              return (
                <button
                  key={name}
                  disabled={already}
                  onClick={() => { onAdd(name); onClose() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
                    border: '1px solid var(--border)', background: already ? 'var(--bg-section)' : 'var(--bg-card)',
                    color: already ? 'var(--text-muted)' : 'var(--text-primary)',
                    fontSize: 12, fontWeight: 600, cursor: already ? 'not-allowed' : 'pointer', textAlign: 'left',
                    opacity: already ? 0.6 : 1,
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: already ? 'var(--bg-hover)' : 'var(--gold)', color: already ? 'var(--text-muted)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                  }}>
                    {initialsOf(name)}
                  </span>
                  <span style={{ flex: 1 }}>{name}</span>
                  {already && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)' }}><Check size={12} /> In room</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
