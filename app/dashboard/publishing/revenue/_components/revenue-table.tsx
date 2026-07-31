'use client'

import { useState } from 'react'
import { DollarSign, AlertTriangle } from 'lucide-react'
import { DataTable, type Column } from '@/components/ui/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { usePublications } from '../../_shared/use-publications'
import type { RevenueRow } from './revenue-data'

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

/**
 * Table of per-publication revenue splits with a simulated initial load.
 * The "Contributor" filter reproduces the "my earnings" framing
 * `/contributor/earnings` used to provide (that page filtered this exact
 * store to one hardcoded name) — now any contributor's rows can be
 * isolated from the same admin view, real data, no separate filtered
 * page needed.
 */
export function RevenueTable() {
  const [contributorFilter, setContributorFilter] = useState('all')
  const { data: publications, loading, error } = usePublications()
  const revenue: RevenueRow[] = publications
    .filter((p) => p.revenueShare)
    .map((p) => ({
      id: p.id,
      publication: p.title,
      contributor: p.contributor,
      contributorShare: p.revenueShare!.contributorShare,
      platformShare: p.revenueShare!.platformShare,
      totalRevenue: p.revenueShare!.totalRevenue,
    }))

  if (loading) {
    return (
      <div className="space-y-2" aria-label="Loading revenue data">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load revenue data" description={error} />
  }

  if (revenue.length === 0) {
    return <EmptyState icon={DollarSign} title="No revenue recorded yet" description="Revenue will appear here once publications generate sales." />
  }

  const contributors = Array.from(new Set(revenue.map((r) => r.contributor))).sort()
  const tableData = contributorFilter === 'all' ? revenue : revenue.filter((r) => r.contributor === contributorFilter)

  const contributorSelect = (
    <select
      value={contributorFilter}
      onChange={(e) => setContributorFilter(e.target.value)}
      className="px-3 py-2 font-lato text-sm border border-w-400 bg-white rounded focus:border-w-600 focus:outline-none"
      aria-label="Filter by contributor"
    >
      <option value="all">All Contributors</option>
      {contributors.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  )

  return (
    <DataTable<RevenueRow>
      data={tableData}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search publication or contributor..."
      searchFilter={(r, q) => r.publication.toLowerCase().includes(q) || r.contributor.toLowerCase().includes(q)}
      filters={contributorSelect}
      emptyMessage="No revenue rows match your search."
    />
  )
}
