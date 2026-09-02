'use client'

import { useState } from 'react'
import { CheckCircle, Ban, AlertTriangle, CheckCheck } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { appointmentStatusConfig, type Appointment, type AppointmentStatus } from '../../_shared/health-data'
import { useAppointmentsAdmin, confirmAppointmentAdmin, completeAppointmentAdmin, cancelAppointmentAdmin } from './use-appointments-admin'

function buildColumns(onConfirm: (a: Appointment) => void, onComplete: (a: Appointment) => void, onCancel: (a: Appointment) => void): Column<Appointment>[] {
  return [
    { key: 'memberName', label: 'Member', sortable: true, render: (a) => <span className="font-semibold text-w-950">{a.memberName ?? '—'}</span> },
    { key: 'clinicName', label: 'Clinic', sortable: true, render: (a) => <span className="text-w-700">{a.clinicName ?? '—'}</span> },
    { key: 'dateTime', label: 'Date/Time', sortable: true, render: (a) => <span>{new Date(a.dateTime).toLocaleString()}</span> },
    { key: 'reason', label: 'Reason', render: (a) => <span className="text-w-700 max-w-50 truncate block">{a.reason}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (a) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${appointmentStatusConfig[a.status].cls}`}>{appointmentStatusConfig[a.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
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

/** Staff-facing appointments oversight — list every member's checkup appointment, confirm/complete/cancel. */
export function AppointmentsAdminView() {
  const { data, loading, error } = useAppointmentsAdmin()
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading appointments">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load appointments" description={error} />
  }

  const handleConfirm = async (a: Appointment) => {
    try { await confirmAppointmentAdmin(a.id); showToast(`Confirmed appointment for ${a.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not confirm this appointment') }
  }
  const handleComplete = async (a: Appointment) => {
    try { await completeAppointmentAdmin(a.id); showToast(`Marked appointment complete for ${a.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not complete this appointment') }
  }
  const handleCancel = async (a: Appointment) => {
    try { await cancelAppointmentAdmin(a.id); showToast(`Cancelled appointment for ${a.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not cancel this appointment') }
  }

  const tableData = statusFilter === 'all' ? data : data.filter((a) => a.status === statusFilter)

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <DataTable<Appointment>
        data={tableData}
        columns={buildColumns(handleConfirm, handleComplete, handleCancel)}
        rowKey={(a) => a.id}
        searchPlaceholder="Search member, clinic, reason..."
        searchFilter={(a, q) => (a.memberName ?? '').toLowerCase().includes(q) || (a.clinicName ?? '').toLowerCase().includes(q) || a.reason.toLowerCase().includes(q)}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(appointmentStatusConfig) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{appointmentStatusConfig[s].label}</option>)}
          </select>
        }
        emptyMessage="No appointments match your filters."
      />
    </div>
  )
}
