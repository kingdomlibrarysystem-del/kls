import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import { auditActionLabels, type AuditAction } from './audit-log-data'
import { useAuditLog } from './use-audit-log'

/**
 * Summary for the audit log: total-event stat cards (one per action type,
 * 9 categories per RULES.md §10, now including PUBLICATION_REJECTED) plus
 * an events-by-action-type chart — both derived from the same live
 * `useAuditLog()` store the table below reads, so a real action logged in
 * this session immediately moves its category's count.
 */
export function AuditLogStats() {
  const entries = useAuditLog()
  const actions = Object.keys(auditActionLabels) as AuditAction[]
  const countsByAction = actions.map((a) => ({
    action: a,
    label: auditActionLabels[a],
    count: entries.filter((e) => e.action === a).length,
  }))

  const chartData = countsByAction.map((c) => ({ name: c.label, value: c.count }))

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        {countsByAction.map((c) => (
          <div key={c.action} className="bg-form-highlight border border-w-300 rounded-lg p-3 text-center">
            <p className="font-cinzel text-xl font-bold text-w-950">{c.count}</p>
            <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-form-highlight border border-w-300 rounded-lg p-4">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Events by Action Type</h2>
        <CategoryBarChart data={chartData} height={220} ariaLabel="Count of audit-log events per action type" />
      </div>
    </div>
  )
}
