'use client'

import Link from 'next/link'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { Scroll, ScrollStatus } from './kcs-pillars-data'

const statusConfig: Record<ScrollStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',    color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED:     { label: 'Archived',     color: 'var(--text-muted)',  bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)',   bg: 'var(--red-dim)'    },
}

interface KcsScrollsTableProps {
  scrolls: Scroll[]
  pillarKey: string
  pillarName: string
}

/**
 * Table view of a pillar's scrolls, reusing the shared `DataTable` primitive
 * (search/sort/paginate already built-in) instead of a new bespoke table.
 * Row click destination matches the Cards view: `/dashboard/kcs/{pillarKey}/{code}`.
 */
export function KcsScrollsTable({ scrolls, pillarKey, pillarName }: KcsScrollsTableProps) {
  const columns: Column<Scroll>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (s) => <span className="stat-chip">{s.code}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (s) => (
        <Link
          href={`/dashboard/kcs/${pillarKey}/${encodeURIComponent(s.code)}`}
          aria-label={`View details for ${s.title}`}
          style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
        >
          {s.title}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (s) => (
        <span style={{ fontSize: 9, fontWeight: 700, color: statusConfig[s.status].color, background: statusConfig[s.status].bg, borderRadius: 4, padding: '2px 7px' }}>
          {statusConfig[s.status].label}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      data={scrolls}
      columns={columns}
      rowKey={(s) => s.code}
      searchPlaceholder={`Search scrolls in ${pillarName}...`}
      searchFilter={(s, q) => s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)}
      emptyMessage="No scrolls found."
      caption={`${scrolls.length} scroll${scrolls.length !== 1 ? 's' : ''} in ${pillarName}`}
    />
  )
}
