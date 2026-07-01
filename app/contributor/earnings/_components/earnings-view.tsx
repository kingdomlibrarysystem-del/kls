'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Receipt } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { bookRevenue, payoutHistory, payoutStatusConfig, type BookRevenueRow, type PayoutRow } from './earnings-data'

/** Simulated network delay before mock earnings data becomes visible. */
const LOAD_DELAY_MS = 400

const revenueColumns: Column<BookRevenueRow>[] = [
  { key: 'publication', label: 'Publication', sortable: true, render: (r) => <span className="font-semibold text-w-950 max-w-55 truncate block">{r.publication}</span> },
  { key: 'contributorShare', label: 'Your Share', sortable: true, render: (r) => <span className="text-w-700">{r.contributorShare}%</span> },
  { key: 'totalRevenue', label: 'Total Revenue (RWF)', sortable: true, render: (r) => <span className="text-w-700">{r.totalRevenue.toLocaleString()}</span> },
  { key: 'contributorEarnings', label: 'Your Earnings (RWF)', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.contributorEarnings.toLocaleString()}</span> },
]

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

/** Per-book revenue breakdown and payout history for the signed-in contributor. */
export function EarningsView() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

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
          <DataTable<BookRevenueRow>
            data={bookRevenue}
            columns={revenueColumns}
            rowKey={(r) => r.id}
            searchPlaceholder="Search publication..."
            searchFilter={(r, q) => r.publication.toLowerCase().includes(q)}
            emptyMessage="No revenue rows match your search."
          />
        )}
      </section>

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
