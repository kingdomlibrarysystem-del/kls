'use client'

import { useState } from 'react'
import { Eye, ClipboardCheck, FilePlus2, XCircle, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { rehabIntakeStatusConfig, type RehabIntake, type RehabIntakeStatus } from '../../_shared/rehab-data'
import { useRehabIntakesAdmin, reviewIntake, createPlanFromIntake, declineIntake } from '../../_shared/use-rehab-intake-admin'

function buildColumns(onReview: (i: RehabIntake) => void, onCreatePlan: (i: RehabIntake) => void, onDecline: (i: RehabIntake) => void): Column<RehabIntake>[] {
  return [
    { key: 'memberName', label: 'Member', sortable: true, render: (i) => <span className="font-semibold text-w-950">{i.memberName ?? '—'}</span> },
    { key: 'concernArea', label: 'Concern Area', render: (i) => <span className="text-w-700 max-w-50 truncate block">{i.concernArea}</span> },
    { key: 'submittedAt', label: 'Submitted', sortable: true, render: (i) => <span>{new Date(i.submittedAt).toLocaleDateString()}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (i) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${rehabIntakeStatusConfig[i.status].cls}`}>{rehabIntakeStatusConfig[i.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/rehabilitation/admin/intake/${i.id}`} aria-label={`View intake for ${i.memberName}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          {i.status === 'SUBMITTED' && (
            <button onClick={() => onReview(i)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-lato hover:bg-blue-100 transition-colors">
              <ClipboardCheck size={12} /> Review
            </button>
          )}
          {i.status === 'UNDER_REVIEW' && (
            <button onClick={() => onCreatePlan(i)} className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded text-xs font-lato hover:bg-green-100 transition-colors">
              <FilePlus2 size={12} /> Create Plan
            </button>
          )}
          {(i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW') && (
            <button onClick={() => onDecline(i)} className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-lato hover:bg-red-100 transition-colors">
              <XCircle size={12} /> Decline
            </button>
          )}
        </div>
      ),
    },
  ]
}

/** Staff-facing intake review oversight, mirrors Beauty/Counseling's admin table pattern. */
export function IntakeTable() {
  const { data, loading, error } = useRehabIntakesAdmin()
  const [statusFilter, setStatusFilter] = useState<RehabIntakeStatus | 'all'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading intakes" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load intakes" description={error} />

  const handleReview = async (i: RehabIntake) => {
    try { await reviewIntake(i.id); showToast(`Marked under review for ${i.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not review this intake') }
  }
  const handleCreatePlan = async (i: RehabIntake) => {
    try { await createPlanFromIntake(i.id); showToast(`Plan created for ${i.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not create a plan') }
  }
  const handleDecline = async (i: RehabIntake) => {
    try { await declineIntake(i.id); showToast(`Declined intake for ${i.memberName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not decline this intake') }
  }

  const tableData = statusFilter === 'all' ? data : data.filter((i) => i.status === statusFilter)

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <DataTable<RehabIntake>
        data={tableData}
        columns={buildColumns(handleReview, handleCreatePlan, handleDecline)}
        rowKey={(i) => i.id}
        searchPlaceholder="Search member, concern area..."
        searchFilter={(i, q) => (i.memberName ?? '').toLowerCase().includes(q) || i.concernArea.toLowerCase().includes(q)}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RehabIntakeStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(rehabIntakeStatusConfig) as RehabIntakeStatus[]).map((s) => <option key={s} value={s}>{rehabIntakeStatusConfig[s].label}</option>)}
          </select>
        }
        emptyMessage="No intakes match your filters."
      />
    </div>
  )
}
