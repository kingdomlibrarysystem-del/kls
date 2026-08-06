'use client'

import { AlertTriangle, TrendingUp } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { RankingBarChart } from '@/components/ui/ranking-bar-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { exportToCsv } from '@/lib/utils'
import { useLibraryReports } from './use-library-reports'
import type { OverdueEntry, TopResourceEntry, FineEntry, FineStatus } from './reports-data'

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

function LoadingSkeleton() {
  return <Skeleton className="h-40 w-full rounded-lg" aria-label="Loading report" />
}

export function OverdueTable() {
  const { data, loading, error } = useLibraryReports()
  if (loading) return <LoadingSkeleton />
  if (error || !data) return <EmptyState icon={AlertTriangle} title="Couldn't load overdue items" description={error ?? 'Failed to load report data'} />
  return (
    <DataTable<OverdueEntry>
      data={data.overdueList}
      columns={overdueColumns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search overdue member or resource..."
      searchFilter={(r, q) => r.memberName.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q)}
      emptyMessage="No overdue items."
    />
  )
}

/** Ranking chart of the same top-borrowed resources shown in the table below, sized to the data's own max borrow count rather than a fixed percentage scale. */
export function TopResourcesChart() {
  const { data, loading, error } = useLibraryReports()
  if (loading) return <LoadingSkeleton />
  if (error || !data || data.topResources.length === 0) return null
  const maxValue = Math.max(...data.topResources.map((r) => r.borrowCount))
  const chartData = data.topResources
    .map((r) => ({ name: r.title, value: r.borrowCount }))
    .sort((a, b) => b.value - a.value)
  return (
    <RankingBarChart
      data={chartData}
      unit=""
      maxValue={Math.ceil(maxValue / 5) * 5}
      height={Math.max(160, chartData.length * 40)}
      ariaLabel="Top-borrowed resources ranked by number of times borrowed"
    />
  )
}

export function TopResourcesTable() {
  const { data, loading, error } = useLibraryReports()
  if (loading) return <LoadingSkeleton />
  if (error || !data) return <EmptyState icon={TrendingUp} title="Couldn't load top resources" description={error ?? 'Failed to load report data'} />
  return (
    <DataTable<TopResourceEntry>
      data={data.topResources}
      columns={topResourceColumns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search resource or category..."
      searchFilter={(r, q) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)}
      emptyMessage="No borrowing activity yet."
    />
  )
}

function exportFineCollection(fineCollection: FineEntry[]) {
  exportToCsv('fine-collection', [
    { label: 'Member', get: (r: FineEntry) => r.memberName },
    { label: 'Resource', get: (r: FineEntry) => r.resourceTitle },
    { label: 'Days Overdue', get: (r: FineEntry) => r.daysOverdue },
    { label: 'Amount (RWF)', get: (r: FineEntry) => r.amount },
    { label: 'Status', get: (r: FineEntry) => fineStatusConfig[r.status].label },
  ], fineCollection)
}

export function FineCollectionTable() {
  const { data, loading, error } = useLibraryReports()
  if (loading) return <LoadingSkeleton />
  if (error || !data) return <EmptyState icon={AlertTriangle} title="Couldn't load fine collection" description={error ?? 'Failed to load report data'} />
  return (
    <DataTable<FineEntry>
      data={data.fineCollection}
      columns={fineColumns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search member or resource..."
      searchFilter={(r, q) => r.memberName.toLowerCase().includes(q) || r.resourceTitle.toLowerCase().includes(q)}
      onExport={() => exportFineCollection(data.fineCollection)}
      emptyMessage="No fines recorded."
    />
  )
}
