'use client'

import { useState } from 'react'
import { Eye, CheckCircle, CheckCheck, Ban, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { beautyAppointmentStatusConfig, type BeautyAppointment, type BeautyAppointmentStatus } from '../../_shared/beauty-data'
import { useBeautyAppointmentsAdmin, confirmBeautyAppointment, completeBeautyAppointment, cancelBeautyAppointmentAdmin } from '../../_shared/use-beauty-admin'

function buildColumns(onConfirm: (a: BeautyAppointment) => void, onComplete: (a: BeautyAppointment) => void, onCancel: (a: BeautyAppointment) => void): Column<BeautyAppointment>[] {
  return [
    { key: 'memberName', label: 'Member', sortable: true, render: (a) => <span className="font-semibold text-w-950">{a.memberName ?? '—'}</span> },
    { key: 'providerName', label: 'Provider', sortable: true, render: (a) => <span className="text-w-700">{a.providerName ?? '—'}</span> },
    { key: 'serviceName', label: 'Service', render: (a) => <span className="text-w-700">{a.serviceName ?? '—'}</span> },
    { key: 'dateTime', label: 'Date/Time', sortable: true, render: (a) => <span>{new Date(a.dateTime).toLocaleString()}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (a) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${beautyAppointmentStatusConfig[a.status].cls}`}>{beautyAppointmentStatusConfig[a.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/beauty/admin/${a.id}`} aria-label={`View appointment for ${a.memberName}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          {a.status === 'PENDING' && (
            <button onClick={() => onConfirm(a)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
              <CheckCircle size={12} /> Confirm
            </button>
          )}
          {a.status === 'CONFIRMED' && (
            <button onClick={() => onComplete(a)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
              <CheckCheck size={12} /> Complete
            </button>
          )}
          {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
            <button onClick={() => onCancel(a)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
              <Ban size={12} /> Cancel
            </button>
          )}
        </div>
      ),
    },
  ]
}

/** Staff-facing appointments oversight — mirrors Health's AppointmentsAdminView + Borrowings' DataTable pattern. */
export function BeautyAppointmentsTable() {
  const { data, loading, error } = useBeautyAppointmentsAdmin()
  const [statusFilter, setStatusFilter] = useState<BeautyAppointmentStatus | 'all'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading appointments">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load appointments" description={error} />

  const handleConfirm = async (a: BeautyAppointment) => {
    try { await confirmBeautyAppointment(a.id); showToast(`Confirmed appointment for ${a.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not confirm this appointment') }
  }
  const handleComplete = async (a: BeautyAppointment) => {
    try { await completeBeautyAppointment(a.id); showToast(`Marked appointment complete for ${a.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not complete this appointment') }
  }
  const handleCancel = async (a: BeautyAppointment) => {
    try { await cancelBeautyAppointmentAdmin(a.id); showToast(`Cancelled appointment for ${a.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not cancel this appointment') }
  }

  const tableData = statusFilter === 'all' ? data : data.filter((a) => a.status === statusFilter)

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <DataTable<BeautyAppointment>
        data={tableData}
        columns={buildColumns(handleConfirm, handleComplete, handleCancel)}
        rowKey={(a) => a.id}
        searchPlaceholder="Search member, provider, service..."
        searchFilter={(a, q) => (a.memberName ?? '').toLowerCase().includes(q) || (a.providerName ?? '').toLowerCase().includes(q) || (a.serviceName ?? '').toLowerCase().includes(q)}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BeautyAppointmentStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(beautyAppointmentStatusConfig) as BeautyAppointmentStatus[]).map((s) => <option key={s} value={s}>{beautyAppointmentStatusConfig[s].label}</option>)}
          </select>
        }
        emptyMessage="No appointments match your filters."
      />
    </div>
  )
}
