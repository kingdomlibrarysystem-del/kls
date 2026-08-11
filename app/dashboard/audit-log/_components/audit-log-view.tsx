'use client'

import { useState } from 'react'
import { ScrollText, Eye } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { auditActionLabels, type AuditEntry, type AuditAction } from './audit-log-data'
import { useAuditLog } from './use-audit-log'
import { AuditEntryDetailModal } from './audit-entry-detail-modal'
import { AuditLogStats } from './audit-log-stats'

function buildColumns(onView: (e: AuditEntry) => void): Column<AuditEntry>[] {
  return [
    { key: 'actor', label: 'Actor', sortable: true, render: (e) => <span className="font-semibold text-w-950">{e.actor}</span> },
    {
      key: 'action', label: 'Action', sortable: true,
      render: (e) => <span className="px-2.5 py-0.5 rounded border border-w-300 bg-w-100 text-w-950 text-xs font-lato font-semibold">{auditActionLabels[e.action]}</span>,
    },
    { key: 'target', label: 'Target', sortable: true, render: (e) => <span className="text-w-700 max-w-70 truncate block">{e.target}</span> },
    { key: 'timestamp', label: 'Timestamp', sortable: true, render: (e) => <span className="text-w-700">{new Date(e.timestamp).toLocaleString()}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (e) => (
        <button onClick={() => onView(e)} aria-label={`View audit entry for ${e.actor}`} className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
          <Eye size={12} /> View
        </button>
      ),
    },
  ]
}

/** DataTable of audit-log entries (actor, action, target, timestamp), searchable and filterable by action. */
export function AuditLogView() {
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all')
  const [viewing, setViewing] = useState<AuditEntry | null>(null)
  const { data: entries, loading } = useAuditLog()

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading audit log">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return <EmptyState icon={ScrollText} title="No audit entries yet" description="Audit events will appear here as they occur." />
  }

  const tableData = actionFilter === 'all' ? entries : entries.filter((e) => e.action === actionFilter)

  return (
    <>
      <AuditLogStats />
      <DataTable<AuditEntry>
        data={tableData}
        columns={buildColumns(setViewing)}
        rowKey={(e) => e.id}
        searchPlaceholder="Search actor or target..."
        searchFilter={(e, q) => e.actor.toLowerCase().includes(q) || e.target.toLowerCase().includes(q)}
        filters={
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | 'all')}
            aria-label="Filter by action"
            className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          >
            <option value="all">All Actions</option>
            {(Object.keys(auditActionLabels) as AuditAction[]).map((a) => (
              <option key={a} value={a}>{auditActionLabels[a]}</option>
            ))}
          </select>
        }
        emptyMessage="No audit entries match your filters."
      />
      <AuditEntryDetailModal entry={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
