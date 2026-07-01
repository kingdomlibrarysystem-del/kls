'use client'

import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { mockRevenue, type RevenueRow } from './revenue-data'

/** Simulated network delay before mock revenue rows become visible. */
const LOAD_DELAY_MS = 400

const columns: Column<RevenueRow>[] = [
  { key: 'publication', label: 'Publication', sortable: true, render: (r) => <span className="font-semibold text-w-950 max-w-55 truncate block">{r.publication}</span> },
  { key: 'contributor', label: 'Contributor', sortable: true, render: (r) => <span className="text-w-700">{r.contributor}</span> },
  { key: 'contributorShare', label: 'Contributor %', sortable: true, render: (r) => <span className="text-w-700">{r.contributorShare}%</span> },
  { key: 'platformShare', label: 'Platform %', sortable: true, render: (r) => <span className="text-w-700">{r.platformShare}%</span> },
  {
    key: 'totalRevenue', label: 'Total Revenue (RWF)', sortable: true,
    render: (r) => <span className="font-semibold text-w-950">{r.totalRevenue.toLocaleString()}</span>,
  },
]

/** Table of per-publication revenue splits with a simulated initial load. */
export function RevenueTable() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading revenue data">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (mockRevenue.length === 0) {
    return <EmptyState icon={DollarSign} title="No revenue recorded yet" description="Revenue will appear here once publications generate sales." />
  }

  return (
    <DataTable<RevenueRow>
      data={mockRevenue}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search publication or contributor..."
      searchFilter={(r, q) => r.publication.toLowerCase().includes(q) || r.contributor.toLowerCase().includes(q)}
      emptyMessage="No revenue rows match your search."
    />
  )
}
