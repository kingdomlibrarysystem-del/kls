'use client'

import { CheckCircle2, XCircle, History } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useLoginHistory } from './use-login-history'
import type { LoginEvent } from './security-mock-data'
import { Skeleton } from '@/components/ui/skeleton'

const columns: Column<LoginEvent>[] = [
  { key: 'date', label: 'Date', sortable: true, render: (e) => <span className="text-w-700">{e.date}</span> },
  { key: 'ip', label: 'IP Address', sortable: true, render: (e) => <span className="font-mono text-xs text-w-600">{e.ip}</span> },
  { key: 'device', label: 'Device', sortable: true, render: (e) => <span className="text-w-700">{e.device}</span> },
  {
    key: 'success', label: 'Result', sortable: true,
    render: (e) => (
      <span className={`flex items-center gap-1 text-xs font-semibold ${e.success ? 'text-green-700' : 'text-red-700'}`}>
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
    <div className="bg-form-section border border-w-400 rounded-lg p-6 mt-6">
      <h3 className="font-cinzel text-lg font-semibold text-w-950 mb-4 flex items-center gap-2">
        <History size={18} className="text-w-600" /> Login History
      </h3>
      {loading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : error ? (
        <EmptyState icon={History} title="Could not load login history" description={error} />
      ) : loginHistory.length === 0 ? (
        <EmptyState icon={History} title="No login history yet" description="Your login events will appear here." />
      ) : (
        <DataTable<LoginEvent> data={loginHistory} columns={columns} rowKey={(e) => e.id} emptyMessage="No login events." />
      )}
    </div>
  )
}
