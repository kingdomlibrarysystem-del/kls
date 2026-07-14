'use client'

import { useState } from 'react'
import { Monitor, ShieldOff } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { mockSessions, type SessionEntry } from './security-mock-data'

/** DataTable of active sessions/devices with a "Revoke" action for non-current sessions. */
export function SessionsSection() {
  const [sessions, setSessions] = useState<SessionEntry[]>(mockSessions)
  const [toast, setToast] = useState('')

  const handleRevoke = (session: SessionEntry) => {
    try {
      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      setToast(`Revoked session on ${session.device}`)
      setTimeout(() => setToast(''), 3000)
    } catch {
      setToast('Could not revoke this session — please try again')
    }
  }

  const columns: Column<SessionEntry>[] = [
    {
      key: 'device', label: 'Device', sortable: true,
      render: (s) => (
        <span className="flex items-center gap-1.5" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          <Monitor size={13} color="var(--text-muted)" /> {s.device} {s.current && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--green)' }}>(this device)</span>}
        </span>
      ),
    },
    { key: 'location', label: 'Location', sortable: true, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.location}</span> },
    { key: 'lastActive', label: 'Last Active', sortable: true, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.lastActive}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => s.current ? null : (
        <button
          onClick={() => handleRevoke(s)}
          aria-label={`Revoke session on ${s.device}`}
          className="flex items-center gap-1 ml-auto transition-colors"
          style={{ padding: '4px 10px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 4, fontSize: 11 }}
        >
          <ShieldOff size={12} /> Revoke
        </button>
      ),
    },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Sessions & Devices</div>
      {toast && (
        <div style={{ background: 'var(--green-dim)', color: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 6, padding: '6px 10px', fontSize: 10, marginBottom: 10 }}>{toast}</div>
      )}
      {sessions.length === 0 ? (
        <EmptyState icon={Monitor} title="No active sessions" description="All sessions have been revoked." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <DataTable<SessionEntry> data={sessions} columns={columns} rowKey={(s) => s.id} emptyMessage="No sessions." />
      )}
    </div>
  )
}
