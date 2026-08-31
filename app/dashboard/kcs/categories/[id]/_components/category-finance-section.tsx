'use client'

import { Wallet } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable, type Column } from '@/components/ui/data-table'
import { typeConfig, statusConfig, type Transaction } from '@/app/dashboard/library/sales/_components/sales-data'

interface CategoryFinanceSectionProps {
  orders: Transaction[]
}

/** Real Sale/Rental Orders for resources filed under this category — joined client-side via each Order's real resourceId, same categoryId-derived approach as the Borrowings/Reservations sections. */
export function CategoryFinanceSection({ orders }: CategoryFinanceSectionProps) {
  if (orders.length === 0) {
    return <EmptyState icon={Wallet} title="No transactions yet" description="No sale or rental has been made for a resource in this category." style={{ color: 'var(--text-secondary)' }} />
  }

  const paidTotal = orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)

  const columns: Column<Transaction>[] = [
    { key: 'buyerName', label: 'Buyer', sortable: true, render: (o) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.buyerName}</span> },
    { key: 'resourceTitle', label: 'Resource', sortable: true, render: (o) => o.resourceTitle },
    {
      key: 'type', label: 'Type',
      render: (o) => <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${typeConfig[o.type].cls}`}>{typeConfig[o.type].label}</span>,
    },
    { key: 'amount', label: 'Amount', sortable: true, render: (o) => `${o.amount.toLocaleString()} RWF` },
    {
      key: 'status', label: 'Status',
      render: (o) => <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${statusConfig[o.status].cls}`}>{statusConfig[o.status].label}</span>,
    },
    { key: 'date', label: 'Date', sortable: true, render: (o) => o.date },
  ]

  return (
    <div>
      <p className="font-lato text-xs text-w-600 dark:text-white/50 mb-2">
        <span className="font-semibold text-w-950 dark:text-white">{paidTotal.toLocaleString()} RWF</span> total paid revenue
      </p>
      <DataTable
        data={orders}
        columns={columns}
        rowKey={(o) => o.id}
        emptyMessage="No transactions found."
        caption={`${orders.length} transaction${orders.length !== 1 ? 's' : ''}`}
      />
    </div>
  )
}
