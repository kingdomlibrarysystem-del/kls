'use client'

import { AlertTriangle, TrendingUp } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { overdueList, topResources, fineCollection, type OverdueEntry, type TopResourceEntry, type FineEntry, type FineStatus } from './reports-data'

const fineStatusConfig: Record<FineStatus, { label: string; cls: string }> = {
  UNPAID: { label: 'Unpaid', cls: 'bg-red-50    text-red-800    border-red-200'    },
  PAID:   { label: 'Paid',   cls: 'bg-green-50  text-green-800  border-green-200'  },
  WAIVED: { label: 'Waived', cls: 'bg-w-100     text-w-600      border-w-300'      },
}

const overdueColumns: Column<OverdueEntry>[] = [
  { key: 'memberName',    label: 'Member',   sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.memberName}</span> },
  { key: 'resourceTitle', label: 'Resource', sortable: true, render: (r) => <span className="text-w-700">{r.resourceTitle}</span> },
  { key: 'dueDate',       label: 'Due Date', sortable: true, render: (r) => <span className="text-w-700">{r.dueDate}</span> },
  {
    key: 'daysOverdue', label: 'Overdue', sortable: true,
    render: (r) => (
      <span className="flex items-center gap-1 text-red-700 font-semibold text-xs">
        <AlertTriangle size={12} /> {r.daysOverdue}d
      </span>
    ),
  },
]

const topResourceColumns: Column<TopResourceEntry>[] = [
  { key: 'title',    label: 'Resource', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.title}</span> },
  { key: 'category', label: 'Category', sortable: true, render: (r) => <span className="text-w-700">{r.category}</span> },
  {
    key: 'borrowCount', label: 'Times Borrowed', sortable: true,
    render: (r) => (
      <span className="flex items-center gap-1 text-w-600 font-cinzel font-bold">
        <TrendingUp size={12} /> {r.borrowCount}
      </span>
    ),
  },
]

const fineColumns: Column<FineEntry>[] = [
  { key: 'memberName',    label: 'Member',   sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.memberName}</span> },
  { key: 'resourceTitle', label: 'Resource', sortable: true, render: (r) => <span className="text-w-700">{r.resourceTitle}</span> },
  { key: 'daysOverdue',   label: 'Days Overdue', sortable: true, render: (r) => <span className="text-w-700">{r.daysOverdue}d</span> },
  { key: 'amount',        label: 'Amount (RWF)', sortable: true, render: (r) => <span className="font-semibold text-w-950">{r.amount.toLocaleString()}</span> },
  {
    key: 'status', label: 'Status', sortable: true,
    render: (r) => (
      <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${fineStatusConfig[r.status].cls}`}>
        {fineStatusConfig[r.status].label}
      </span>
    ),
  },
]

export function OverdueTable() {
  return (
    <DataTable<OverdueEntry>
      data={overdueList}
      columns={overdueColumns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search overdue member or resource..."
      searchFilter={(r, q) => r.memberName.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q)}
      emptyMessage="No overdue items."
    />
  )
}

export function TopResourcesTable() {
  return (
    <DataTable<TopResourceEntry>
      data={topResources}
      columns={topResourceColumns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search resource or category..."
      searchFilter={(r, q) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)}
      emptyMessage="No borrowing activity yet."
    />
  )
}

export function FineCollectionTable() {
  return (
    <DataTable<FineEntry>
      data={fineCollection}
      columns={fineColumns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search member or resource..."
      searchFilter={(r, q) => r.memberName.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q)}
      onExport={() => console.log('TODO: export CSV')}
      emptyMessage="No fines recorded."
    />
  )
}
