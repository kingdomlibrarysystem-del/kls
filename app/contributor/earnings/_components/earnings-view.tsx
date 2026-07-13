'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Receipt, Eye } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CONTRIBUTOR_NAME } from '@/app/contributor/_components/contributor-identity'
import { useRevenue } from '@/app/dashboard/publishing/revenue/_components/use-revenue'
import type { RevenueRow } from '@/app/dashboard/publishing/revenue/_components/revenue-data'
import { payoutHistory, payoutStatusConfig, type PayoutRow } from './earnings-data'
import { RevenueDetailModal } from './revenue-detail-modal'

/** Simulated network delay before the shared revenue store's initial snapshot is shown. */
const LOAD_DELAY_MS = 400

/** `RevenueRow` plus the one field this view needs that the admin table doesn't show — a pure derived number, not independent data. */
export interface ContributorRevenueRow extends RevenueRow {
  contributorEarnings: number
}

function buildRevenueColumns(onView: (r: ContributorRevenueRow) => void): Column<ContributorRevenueRow>[] {
  return [
    { key: 'publication', label: 'Publication', sortable: true, render: (r) => <span className="font-semibold text-w-950 max-w-55 truncate block">{r.publication}</span> },
    { key: 'contributorShare', label: 'Your Share', sortable: true, render: (r) => <span className="text-w-700">{r.contributorShare}%</span> },
    { key: 'totalRevenue', label: 'Total Revenue (RWF)', sortable: true, render: (r) => <span className="text-w-700">{r.totalRevenue.toLocaleString()}</span> },
    { key: 'contributorEarnings', label: 'Your Earnings (RWF)', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.contributorEarnings.toLocaleString()}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (r) => (
        <button onClick={() => onView(r)} aria-label={`View revenue details for ${r.publication}`} className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
          <Eye size={12} /> View
        </button>
      ),
    },
  ]
}

const payoutColumns: Column<PayoutRow>[] = [
  { key: 'date', label: 'Date', sortable: true, render: (p) => <span className="text-w-700">{p.date}</span> },
  { key: 'amount', label: 'Amount (RWF)', sortable: true, render: (p) => <span className="font-semibold text-w-950">{p.amount.toLocaleString()}</span> },
  { key: 'method', label: 'Method', sortable: true, render: (p) => <span className="text-w-700">{p.method}</span> },
  {
    key: 'status', label: 'Status', sortable: true,
    render: (p) => (
      <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${payoutStatusConfig[p.status].cls}`}>
        {payoutStatusConfig[p.status].label}
      </span>
    ),
  },
]

function LoadingRows() {
  return (
    <div className="space-y-2" aria-label="Loading earnings data">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} style={{ height: 48, borderRadius: 8 }} />
      ))}
    </div>
  )
}

/**
 * Per-book revenue breakdown and payout history for the signed-in
 * contributor. Revenue rows are read directly from the same `useRevenue()`
 * store `/dashboard/publishing/revenue` renders — filtered to this
 * contributor — so an admin approving a submission in the Review Queue
 * (which calls `addRevenueRowForApproval`) is reflected here immediately,
 * instead of this page showing a frozen, hand-authored copy that could
 * silently drift from (or contradict) the admin-side pending/approved state.
 */
export function EarningsView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<ContributorRevenueRow | null>(null)
  const revenue = useRevenue()

  const bookRevenue: ContributorRevenueRow[] = revenue
    .filter((r) => r.contributor === CONTRIBUTOR_NAME)
    .map((r) => ({ ...r, contributorEarnings: Math.round((r.totalRevenue * r.contributorShare) / 100) }))

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const matchingPayout = viewing ? payoutHistory.find((p) => p.amount === viewing.contributorEarnings) : undefined

  return (
    <div className="space-y-8">
      <section>
        <h2 className="cinzel flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          <DollarSign size={14} style={{ color: 'var(--gold)' }} /> Revenue by Publication
        </h2>
        {loading ? (
          <LoadingRows />
        ) : bookRevenue.length === 0 ? (
          <EmptyState icon={DollarSign} title="No revenue yet" description="Earnings appear here once a published book generates sales." style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <DataTable<ContributorRevenueRow>
            data={bookRevenue}
            columns={buildRevenueColumns(setViewing)}
            rowKey={(r) => r.id}
            searchPlaceholder="Search publication..."
            searchFilter={(r, q) => r.publication.toLowerCase().includes(q)}
            emptyMessage="No revenue rows match your search."
          />
        )}
      </section>

      <RevenueDetailModal row={viewing} matchingPayout={matchingPayout} onClose={() => setViewing(null)} />

      <section>
        <h2 className="cinzel flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          <Receipt size={14} style={{ color: 'var(--gold)' }} /> Payout History
        </h2>
        {loading ? (
          <LoadingRows />
        ) : payoutHistory.length === 0 ? (
          <EmptyState icon={Receipt} title="No payouts yet" description="Payout history will appear here once a transfer is issued." style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <DataTable<PayoutRow>
            data={payoutHistory}
            columns={payoutColumns}
            rowKey={(p) => p.id}
            emptyMessage="No payouts recorded."
          />
        )}
      </section>
    </div>
  )
}
