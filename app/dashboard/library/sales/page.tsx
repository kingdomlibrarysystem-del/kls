'use client'

import { useState } from 'react'
import { ShoppingCart, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable, type Column } from '@/components/ui/data-table'

// ── Types ─────────────────────────────────────────────────────────────────────
type TransactionType = 'SALE' | 'RENTAL'

interface Transaction {
  id: string
  buyerName: string
  buyerEmail: string
  resourceTitle: string
  resourceFormat: string
  type: TransactionType
  amount: number
  date: string
}

const typeConfig: Record<TransactionType, { label: string; cls: string }> = {
  SALE:   { label: 'Sale',   cls: 'bg-green-50 text-green-800 border-green-200' },
  RENTAL: { label: 'Rental', cls: 'bg-teal-50  text-teal-800  border-teal-200'  },
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const initialData: Transaction[] = [
  { id: 'tx-001', buyerName: 'Jean Paul Nkurunziza', buyerEmail: 'jeanpaul@example.com', resourceTitle: 'The Pursuit of Knowledge',   resourceFormat: 'E-Book',      type: 'SALE',   amount: 4500, date: '2026-06-02' },
  { id: 'tx-002', buyerName: 'Amina Uwimana',        buyerEmail: 'amina@example.com',    resourceTitle: 'Digital Transformation',      resourceFormat: 'PDF Journal', type: 'RENTAL', amount: 1200, date: '2026-06-05' },
  { id: 'tx-003', buyerName: 'Eric Habimana',         buyerEmail: 'eric@example.com',     resourceTitle: 'Ancient Civilizations',       resourceFormat: 'E-Book',      type: 'SALE',   amount: 5500, date: '2026-06-09' },
  { id: 'tx-004', buyerName: 'Grace Mukamana',        buyerEmail: 'grace@example.com',    resourceTitle: 'Modern Art & Culture',        resourceFormat: 'Interactive PDF', type: 'RENTAL', amount: 900,  date: '2026-06-12' },
  { id: 'tx-005', buyerName: 'David Ndayisenga',      buyerEmail: 'david@example.com',    resourceTitle: 'Introduction to Web Development', resourceFormat: 'E-Book', type: 'SALE',   amount: 7000, date: '2026-06-15' },
  { id: 'tx-006', buyerName: 'Sarah Uwase',           buyerEmail: 'sarah@example.com',    resourceTitle: 'World History Essentials',    resourceFormat: 'E-Book',      type: 'RENTAL', amount: 1000, date: '2026-06-18' },
  { id: 'tx-007', buyerName: 'Patrick Iradukunda',    buyerEmail: 'patrick@example.com',  resourceTitle: 'The Pursuit of Knowledge',    resourceFormat: 'E-Book',      type: 'RENTAL', amount: 1500, date: '2026-06-21' },
  { id: 'tx-008', buyerName: 'Claudine Ingabire',     buyerEmail: 'claudine@example.com', resourceTitle: 'Digital Transformation',      resourceFormat: 'PDF Journal', type: 'SALE',   amount: 6000, date: '2026-06-24' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function SalesRentalsPage() {
  const [data] = useState<Transaction[]>(initialData)
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')

  const tableData = typeFilter === 'all' ? data : data.filter((r) => r.type === typeFilter)

  const stats = [
    { label: 'Total Transactions', value: data.length,                                                      color: 'text-w-950'     },
    { label: 'Sales',              value: data.filter((r) => r.type === 'SALE').length,                     color: 'text-green-700' },
    { label: 'Rentals',            value: data.filter((r) => r.type === 'RENTAL').length,                   color: 'text-teal-700'  },
    { label: 'Total Revenue (RWF)', value: data.reduce((sum, r) => sum + r.amount, 0).toLocaleString(),      color: 'text-w-600'     },
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
          <p className="font-semibold text-w-950 max-w-[220px] truncate">{t.resourceTitle}</p>
          <p className="text-xs text-w-600">{t.resourceFormat}</p>
        </div>
      ),
    },
    {
      key: 'type', label: 'Type', sortable: true,
      render: (t) => (
        <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${typeConfig[t.type].cls}`}>
          {typeConfig[t.type].label}
        </span>
      ),
    },
    {
      key: 'amount', label: 'Amount (RWF)', sortable: true,
      render: (t) => <span className="font-semibold text-w-950">{t.amount.toLocaleString()}</span>,
    },
    {
      key: 'date', label: 'Date', sortable: true,
      render: (t) => <span className="text-w-700">{t.date}</span>,
    },
  ]

  return (
    <div>
      <PageHeader title="Sales & Rentals" subtitle="Digital resource purchases and rental transactions" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-form-highlight border border-w-300 rounded-lg p-4 text-center">
            <p className={`font-cinzel text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-lato text-xs text-w-700 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      <DataTable<Transaction>
        data={tableData}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search buyer, resource, ID..."
        searchFilter={(r, q) =>
          r.buyerName.toLowerCase().includes(q)     ||
          r.buyerEmail.toLowerCase().includes(q)    ||
          r.resourceTitle.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
        }
        filters={
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
            className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
          >
            <option value="all">All Types</option>
            {(Object.keys(typeConfig) as TransactionType[]).map((t) => (
              <option key={t} value={t}>{typeConfig[t].label}</option>
            ))}
          </select>
        }
        onExport={() => console.log('TODO: export CSV')}
        emptyMessage="No transactions match your filters."
      />

      <div className="mt-4 flex items-center gap-2 text-xs text-w-600 font-lato">
        <RefreshCw size={12} /> Figures are illustrative — payment processing is not yet wired up.
        <ShoppingCart size={12} className="ml-2" />
      </div>
    </div>
  )
}
