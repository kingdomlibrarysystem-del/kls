'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { mockLoginHistory, type LoginEvent } from './security-mock-data'

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

/** DataTable of login events: date, IP, device, success/fail. */
export function LoginHistorySection() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>Login History</div>
      {mockLoginHistory.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No login history yet" description="Your login events will appear here." style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <DataTable<LoginEvent> data={mockLoginHistory} columns={columns} rowKey={(e) => e.id} emptyMessage="No login events." />
      )}
    </div>
  )
}
