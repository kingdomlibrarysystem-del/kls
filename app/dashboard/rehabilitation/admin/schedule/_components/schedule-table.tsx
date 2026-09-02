'use client'

import { useState } from 'react'
import { Eye, CheckCheck, CalendarX, Ban, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { rehabSessionStatusConfig, type RehabSession, type RehabSessionStatus } from '../../../_shared/rehab-data'
import { useRehabScheduleAdmin, completeSession, markSessionMissed, cancelSessionAdmin } from '../../../_shared/use-rehab-schedule-admin'
import { ScheduleSessionForm } from './schedule-session-form'

function buildColumns(onComplete: (s: RehabSession) => void, onMissed: (s: RehabSession) => void, onCancel: (s: RehabSession) => void): Column<RehabSession>[] {
  return [
    { key: 'memberName', label: 'Member', sortable: true, render: (s) => <span className="font-semibold text-w-950">{s.memberName ?? '—'}</span> },
    { key: 'focus', label: 'Focus', render: (s) => <span className="text-w-700">{s.focus}</span> },
    { key: 'groupName', label: 'Group', render: (s) => <span className="text-w-700">{s.groupName ?? '—'}</span> },
    { key: 'dateTime', label: 'Date/Time', sortable: true, render: (s) => <span>{new Date(s.dateTime).toLocaleString()}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (s) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${rehabSessionStatusConfig[s.status].cls}`}>{rehabSessionStatusConfig[s.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/rehabilitation/admin/schedule/${s.id}`} aria-label={`View session for ${s.memberName}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          {s.status === 'SCHEDULED' && (
            <>
              <button onClick={() => onComplete(s)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
                <CheckCheck size={12} /> Complete
              </button>
              <button onClick={() => onMissed(s)} className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-lato hover:bg-orange-100 transition-colors">
                <CalendarX size={12} /> Missed
              </button>
              <button onClick={() => onCancel(s)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
                <Ban size={12} /> Cancel
              </button>
            </>
          )}
        </div>
      ),
    },
  ]
}

/** Staff-facing schedule oversight + real "Schedule Session" creation form. */
export function ScheduleTable() {
  const { data, loading, error } = useRehabScheduleAdmin()
  const [statusFilter, setStatusFilter] = useState<RehabSessionStatus | 'all'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading schedule" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load schedule" description={error} />

  const handleComplete = async (s: RehabSession) => {
    try { await completeSession(s.id); showToast(`Marked session complete for ${s.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not complete this session') }
  }
  const handleMissed = async (s: RehabSession) => {
    try { await markSessionMissed(s.id); showToast(`Marked session missed for ${s.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not mark this session missed') }
  }
  const handleCancel = async (s: RehabSession) => {
    try { await cancelSessionAdmin(s.id); showToast(`Cancelled session for ${s.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not cancel this session') }
  }

  const tableData = statusFilter === 'all' ? data : data.filter((s) => s.status === statusFilter)

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <ScheduleSessionForm onScheduled={() => showToast('Session scheduled.')} />
      <DataTable<RehabSession>
        data={tableData}
        columns={buildColumns(handleComplete, handleMissed, handleCancel)}
        rowKey={(s) => s.id}
        searchPlaceholder="Search member, focus..."
        searchFilter={(s, q) => (s.memberName ?? '').toLowerCase().includes(q) || s.focus.toLowerCase().includes(q)}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RehabSessionStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(rehabSessionStatusConfig) as RehabSessionStatus[]).map((s) => <option key={s} value={s}>{rehabSessionStatusConfig[s].label}</option>)}
          </select>
        }
        emptyMessage="No sessions match your filters."
      />
    </div>
  )
}
