'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { ElegantButton } from '@/components/ui/elegant-button'
import { knownPeopleExcluding } from './known-people'

interface NewDmModalProps {
  open: boolean
  personName: string
  onClose: () => void
  onSelect: (otherName: string) => void
}

/** Picker for starting a new DM — lists every known named person except yourself, since there's no general user directory to search. */
export function NewDmModal({ open, personName, onClose, onSelect }: NewDmModalProps) {
  const [selected, setSelected] = useState('')
  const people = knownPeopleExcluding(personName)

  const handleStart = () => {
    if (!selected) return
    onSelect(selected)
    setSelected('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Direct Message" size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {people.map((p) => (
          <button
            key={p.name}
            onClick={() => setSelected(p.name)}
            aria-pressed={selected === p.name}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
              borderRadius: 6, border: `1px solid ${selected === p.name ? 'var(--gold)' : 'var(--border)'}`,
              background: selected === p.name ? 'rgba(212,168,67,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.role}</span>
          </button>
        ))}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <ElegantButton type="button" variant="outline" onClick={onClose}>Cancel</ElegantButton>
          <ElegantButton type="button" variant="primary" onClick={handleStart} disabled={!selected}>Start Chat</ElegantButton>
        </div>
      </div>
    </Modal>
  )
}
