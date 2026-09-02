'use client'

import { useState } from 'react'
import { Eye, RefreshCw, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { donationStatusConfig, type Donation, type DonationStatus } from '../../_shared/donations-data'
import { useDonationsAdmin, pollDonationStatus } from '../../_shared/use-donations-admin'

/** All-donations admin DataTable, mirrors library/sales's exact shape. */
export function DonationHistoryTable() {
  const { data, loading, error } = useDonationsAdmin()
  const [statusFilter, setStatusFilter] = useState<DonationStatus | 'all'>('all')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (loading) return <Skeleton className="h-64 w-full rounded-lg" aria-label="Loading donations" />
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load donations" description={error} />

  const handlePoll = async (d: Donation) => {
    try { await pollDonationStatus(d.id); showToast(`Refreshed status for ${d.donorName}`) }
    catch (e) { showToast(e instanceof Error ? e.message : 'Could not refresh this donation') }
  }

  const columns: Column<Donation>[] = [
    { key: 'donorName', label: 'Donor', sortable: true, render: (d) => <span className="font-semibold text-w-950">{d.isAnonymous ? 'Anonymous' : d.donorName}</span> },
    { key: 'amountRwf', label: 'Amount (RWF)', sortable: true, render: (d) => <span className="font-cinzel font-semibold text-w-950">{d.amountRwf.toLocaleString()}</span> },
    { key: 'campaignId', label: 'Target', render: (d) => <span className="text-xs px-2 py-0.5 bg-w-100 rounded font-lato text-w-700">{d.campaignId ? 'Campaign' : 'Sponsorship'}</span> },
    { key: 'createdAt', label: 'Date', sortable: true, render: (d) => <span>{new Date(d.createdAt).toLocaleDateString()}</span> },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (d) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${donationStatusConfig[d.status].cls}`}>{donationStatusConfig[d.status].label}</span>,
    },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <UniversalButton href={`/dashboard/donations/history/${d.id}`} aria-label={`View donation from ${d.donorName}`} variant="secondary" size="sm" icon={<Eye size={12} />} className="!px-2.5 !py-1 !text-xs">View</UniversalButton>
          {d.status === 'pending' && (
            <button onClick={() => handlePoll(d)} className="flex items-center gap-1 px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors"><RefreshCw size={12} /> Check Status</button>
          )}
        </div>
      ),
    },
  ]

  const tableData = statusFilter === 'all' ? data : data.filter((d) => d.status === statusFilter)

  return (
    <div>
      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}
      <DataTable<Donation>
        data={tableData}
        columns={columns}
        rowKey={(d) => d.id}
        searchPlaceholder="Search donor..."
        searchFilter={(d, q) => d.donorName.toLowerCase().includes(q)}
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as DonationStatus | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
            <option value="all">All Statuses</option>
            {(Object.keys(donationStatusConfig) as DonationStatus[]).map((s) => <option key={s} value={s}>{donationStatusConfig[s].label}</option>)}
          </select>
        }
        emptyMessage="No donations match your filters."
      />
    </div>
  )
}
