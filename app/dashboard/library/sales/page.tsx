'use client'

import { useState } from 'react'
import { Eye, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { CategoryBarChart } from '@/components/ui/category-bar-chart'
import { typeConfig, statusConfig, type Transaction, type TransactionType } from './_components/sales-data'
import { useOrdersAdmin } from './_components/use-orders-admin'
import { TransactionDetailModal } from './_components/transaction-detail-modal'

/** Sales & Rentals: real Order transactions (PayPack mobile-money purchases/rentals), read-only log plus a details view per row. */
export default function SalesRentalsPage() {
  const { data, loading, error } = useOrdersAdmin()
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [viewing, setViewing] = useState<Transaction | null>(null)

  if (loading) {
    return (
      <PageTransition>
        <PageHeader title="Sales & Rentals" subtitle="Digital resource purchases and rental transactions" />
        <div className="space-y-2" aria-label="Loading transactions">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <PageHeader title="Sales & Rentals" subtitle="Digital resource purchases and rental transactions" />
        <EmptyState icon={AlertTriangle} title="Couldn't load transactions" description={error} />
      </PageTransition>
    )
  }

  const tableData = typeFilter === 'all' ? data : data.filter((r) => r.type === typeFilter)
  const paidOrders = data.filter((r) => r.status === 'paid')

  const revenueByType = (Object.keys(typeConfig) as TransactionType[]).map((t) => ({
    name: typeConfig[t].label,
    value: paidOrders.filter((r) => r.type === t).reduce((sum, r) => sum + r.amount, 0),
  }))

  const stats = [
    { label: 'Total Transactions', value: data.length, color: 'text-w-950' },
    { label: 'Paid', value: paidOrders.length, color: 'text-green-700' },
    { label: 'Pending', value: data.filter((r) => r.status === 'pending').length, color: 'text-yellow-700' },
    { label: 'Total Revenue (RWF)', value: paidOrders.reduce((sum, r) => sum + r.amount, 0).toLocaleString(), color: 'text-w-600' },
  ]

  const columns: Column<Transaction>[] = [
    {
      key: 'buyerName', label: 'Buyer', sortable: true,
      render: (t) => (
        <div>
          <p className="font-semibold text-w-950">{t.buyerName}</p>
          <p className="text-xs text-w-600">{t.buyerEmail}</p>
        </div>
      ),
    },
    {
      key: 'resourceTitle', label: 'Resource', sortable: true,
      render: (t) => (
        <div>
          <p className="font-semibold text-w-950 max-w-55 truncate">{t.resourceTitle}</p>
          <p className="text-xs text-w-600">{t.resourceFormat}</p>
        </div>
      ),
    },
    {
      key: 'type', label: 'Type', sortable: true,
      render: (t) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${typeConfig[t.type].cls}`}>{typeConfig[t.type].label}</span>,
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (t) => <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[t.status].cls}`}>{statusConfig[t.status].label}</span>,
    },
    { key: 'amount', label: 'Amount (RWF)', sortable: true, render: (t) => <span className="font-semibold text-w-950">{t.amount.toLocaleString()}</span> },
    { key: 'date', label: 'Date', sortable: true, render: (t) => <span className="text-w-700">{t.date}</span> },
    {
      key: 'actions', label: 'Actions', className: 'text-right',
      render: (t) => (
        <button onClick={() => setViewing(t)} aria-label={`View transaction ${t.id}`} className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-w-100 text-w-950 border border-w-300 rounded text-xs font-lato hover:bg-w-200 transition-colors">
          <Eye size={12} /> View
        </button>
      ),
    },
  ]

  return (
    <PageTransition>
      <PageHeader title="Sales & Rentals" subtitle="Digital resource purchases and rental transactions" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
            <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-form-highlight border border-w-300 rounded-lg p-4 mb-6">
        <h2 className="font-cinzel text-sm font-semibold text-w-950 mb-3">Paid Revenue by Type</h2>
        <CategoryBarChart
          data={revenueByType}
          valueFormatter={(v) => `${v.toLocaleString()} RWF`}
          ariaLabel="Total paid revenue split between sales and rentals"
        />
      </div>

      {data.length === 0 ? (
        <EmptyState icon={Eye} title="No transactions yet" description="Purchases and rentals from the public library will appear here." />
      ) : (
        <DataTable<Transaction>
          data={tableData}
          columns={columns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search buyer, resource, ID..."
          searchFilter={(r, q) => r.buyerName.toLowerCase().includes(q) || r.buyerEmail.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)}
          filters={
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')} className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none">
              <option value="all">All Types</option>
              {(Object.keys(typeConfig) as TransactionType[]).map((t) => <option key={t} value={t}>{typeConfig[t].label}</option>)}
            </select>
          }
          emptyMessage="No transactions match your filters."
        />
      )}

      <TransactionDetailModal transaction={viewing} onClose={() => setViewing(null)} />
    </PageTransition>
  )
}
