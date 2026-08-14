'use client'

import { useState } from 'react'
import { Monitor, ShieldOff } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useSessions, type SessionEntry } from './use-sessions'

/**
 * Real Sessions & Devices, backed by /api/sessions — each row is a real
 * UserSession created at login (see lib/auth-options.ts). Revoking a
 * session marks it revokedAt; the next request from that device gets
 * rejected by the jwt callback's revocation check.
 */
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
        <span className="flex items-center gap-1.5 font-semibold text-w-950">
          <Monitor size={13} className="text-w-600" /> {s.device} {s.current && <span className="text-xs font-normal text-green-700">(this device)</span>}
        </span>
      ),
    },
    { key: 'location', label: 'IP Address', sortable: true, render: (s) => <span className="text-w-700">{s.location}</span> },
    { key: 'lastActive', label: 'Last Active', sortable: true, render: (s) => <span className="text-w-700">{s.lastActive}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => s.current ? null : (
        <button
          onClick={() => handleRevoke(s)}
          disabled={revoking === s.id}
          aria-label={`Revoke session on ${s.device}`}
          className="flex items-center gap-1 px-2.5 py-1 ml-auto bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <ShieldOff size={12} /> Revoke
        </button>
      ),
    },
  ]

  return (
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-4">Sessions &amp; Devices</h3>
      {toast && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded mb-3 font-lato text-xs">{toast}</div>
      )}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : sessions.length === 0 ? (
        <EmptyState icon={Monitor} title="No active sessions" description="All sessions have been revoked." />
      ) : (
        <DataTable<SessionEntry> data={sessions} columns={columns} rowKey={(s) => s.id} emptyMessage="No sessions." />
      )}
    </div>
  )
}
