'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useLoginHistory } from '@/app/member/_shared/use-login-history'
import type { LoginEvent } from './security-mock-data'

const columns: Column<LoginEvent>[] = [
  { key: 'date', label: 'Date', sortable: true, render: (e) => <span style={{ color: 'var(--text-secondary)' }}>{e.date}</span> },
  { key: 'ip', label: 'IP Address', sortable: true, render: (e) => <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.ip}</span> },
  { key: 'device', label: 'Device', sortable: true, render: (e) => <span style={{ color: 'var(--text-secondary)' }}>{e.device}</span> },
  {
    key: 'success', label: 'Result', sortable: true,
    render: (e) => (
      <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: e.success ? 'var(--green)' : 'var(--red)' }}>
        {e.success ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {e.success ? 'Success' : 'Failed'}
      </span>
    ),
  },
]

/** DataTable of real login events (date, IP, device, success/fail) from /api/login-history. */
export function LoginHistorySection() {
  const { user } = useAuth()
  const { data: loginHistory, loading, error } = useLoginHistory(user?.id)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Login History</div>
      {loading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : error ? (
        <EmptyState icon={CheckCircle2} title="Could not load login history" description={error} style={{ color: 'var(--text-secondary)' }} />
      ) : loginHistory.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No login history yet" description="Your login events will appear here." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <DataTable<LoginEvent> data={loginHistory} columns={columns} rowKey={(e) => e.id} emptyMessage="No login events." />
      )}
    </div>
  )
}
