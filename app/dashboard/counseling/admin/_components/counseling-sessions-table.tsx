'use client'

import { useState } from 'react'
import { Eye, CheckCircle, CheckCheck, Ban, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { counselingSessionStatusConfig, type CounselingSession, type CounselingSessionStatus } from '../../_shared/counseling-data'
import { useCounselingSessionsAdmin, confirmSession, completeSession, cancelSessionAdmin } from '../../_shared/use-counseling-admin'

function buildColumns(onConfirm: (s: CounselingSession) => void, onComplete: (s: CounselingSession) => void, onCancel: (s: CounselingSession) => void): Column<CounselingSession>[] {
  return [
    { key: 'memberName', label: 'Member', sortable: true, render: (s) => <span className="font-semibold text-w-950">{s.memberName ?? '—'}</span> },
    { key: 'counselorName', label: 'Counselor', sortable: true, render: (s) => <span className="text-w-700">{s.counselorName ?? '—'}</span> },
    { key: 'proposedTime', label: 'Date/Time', sortable: true, render: (s) => <span>{new Date(s.proposedTime).toLocaleString()}</span> },
    { key: 'mode', label: 'Mode', render: (s) => <span className="text-xs px-2 py-0.5 bg-w-100 rounded font-lato text-w-700">{s.mode === 'IN_PERSON' ? 'In Person' : 'Virtual'}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (s) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${counselingSessionStatusConfig[s.status].cls}`}>{counselingSessionStatusConfig[s.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/counseling/admin/${s.id}`} aria-label={`View session for ${s.memberName}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          {s.status === 'PENDING' && (
            <button onClick={() => onConfirm(s)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
              <CheckCircle size={12} /> Confirm
            </button>
          )}
          {s.status === 'CONFIRMED' && (
            <button onClick={() => onComplete(s)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <CheckCheck size={12} /> Complete
            </button>
          )}
          {(s.status === 'PENDING' || s.status === 'CONFIRMED') && (
            <button onClick={() => onCancel(s)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
              <Ban size={12} /> Cancel
            </button>
          )}
        </div>
      ),
    },
  ]
}

/** Staff-facing session oversight — mirrors Beauty's BeautyAppointmentsTable/Health's AppointmentsAdminView. */
export function CounselingSessionsTable() {
  const { data, loading, error } = useCounselingSessionsAdmin()
  const [statusFilter, setStatusFilter] = useState<CounselingSessionStatus | 'all'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading sessions" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load sessions" description={error} />

  const handleConfirm = async (s: CounselingSession) => {
    try { await confirmSession(s.id); showToast(`Confirmed session for ${s.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not confirm this session') }
  }
  const handleComplete = async (s: CounselingSession) => {
    try { await completeSession(s.id); showToast(`Marked session complete for ${s.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not complete this session') }
  }
  const handleCancel = async (s: CounselingSession) => {
    try { await cancelSessionAdmin(s.id); showToast(`Cancelled session for ${s.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not cancel this session') }
  }

  const tableData = statusFilter === 'all' ? data : data.filter((s) => s.status === statusFilter)

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <DataTable<CounselingSession>
        data={tableData}
        columns={buildColumns(handleConfirm, handleComplete, handleCancel)}
        rowKey={(s) => s.id}
        searchPlaceholder="Search member, counselor..."
        searchFilter={(s, q) => (s.memberName ?? '').toLowerCase().includes(q) || (s.counselorName ?? '').toLowerCase().includes(q)}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as CounselingSessionStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(counselingSessionStatusConfig) as CounselingSessionStatus[]).map((s) => <option key={s} value={s}>{counselingSessionStatusConfig[s].label}</option>)}
          </select>
        }
        emptyMessage="No sessions match your filters."
      />
    </div>
  )
}
