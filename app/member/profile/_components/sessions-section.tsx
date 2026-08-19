'use client'

import { useState } from 'react'
import { Monitor, ShieldOff } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useSessions, type SessionEntry } from '@/app/member/_shared/use-sessions'

/** Real Sessions & Devices — same design as the dashboard's SessionsSection, rendered in this module's inline-style dialect. */
export function SessionsSection() {
  const { user, currentSessionId } = useAuth()
  const { data: sessions, loading, refetch } = useSessions(user?.id, currentSessionId)
  const [toast, setToast] = useState('')
  const [revoking, setRevoking] = useState<string | null>(null)

  const handleRevoke = async (session: SessionEntry) => {
    setRevoking(session.id)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.code !== 'success') throw new Error(json.message)
      setToast(`Revoked session on ${session.device}`)
      setTimeout(() => setToast(''), 3000)
      await refetch()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not revoke this session — please try again')
    } finally {
      setRevoking(null)
    }
  }

  const columns: Column<SessionEntry>[] = [
    {
      key: 'device', label: 'Device', sortable: true,
      render: (s) => (
        <span className="flex items-center gap-1.5" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          <Monitor size={15} color="var(--text-muted)" /> {s.device} {s.current && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--green)' }}>(this device)</span>}
        </span>
      ),
    },
    { key: 'location', label: 'IP Address', sortable: true, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.location}</span> },
    { key: 'lastActive', label: 'Last Active', sortable: true, render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.lastActive}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => s.current ? null : (
        <button
          onClick={() => handleRevoke(s)}
          disabled={revoking === s.id}
          aria-label={`Revoke session on ${s.device}`}
          className="flex items-center gap-1 ml-auto transition-colors"
          style={{ padding: '4px 10px', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 4, fontSize: 13, opacity: revoking === s.id ? 0.5 : 1 }}
        >
          <ShieldOff size={14} /> Revoke
        </button>
      ),
    },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Sessions &amp; Devices</div>
      {toast && (
        <div style={{ background: 'var(--green-dim)', color: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 10 }}>{toast}</div>
      )}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : sessions.length === 0 ? (
        <EmptyState icon={Monitor} title="No active sessions" description="All sessions have been revoked." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <DataTable<SessionEntry> data={sessions} columns={columns} rowKey={(s) => s.id} emptyMessage="No sessions." />
      )}
    </div>
  )
}
