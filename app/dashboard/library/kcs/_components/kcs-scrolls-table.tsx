'use client'

import Link from 'next/link'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { Category, CategoryStatus } from '@/lib/kcs-taxonomy'

const statusConfig: Record<CategoryStatus, { label: string; color: string; bg: string }> = {
  AVAILABLE:    { label: 'Available',    color: 'var(--green-light)', bg: 'var(--green-dim)' },
  ARCHIVED:     { label: 'Archived',     color: 'var(--text-muted)',  bg: 'var(--bg-section)' },
  OUT_OF_STOCK: { label: 'Out of Stock', color: 'var(--red-light)',   bg: 'var(--red-dim)'    },
}

interface KcsScrollsTableProps {
  scrolls: Category[]
  pillarSlug: string
  pillarName: string
}

/**
 * Table view of a pillar's scrolls, reusing the shared `DataTable` primitive
 * (search/sort/paginate already built-in) instead of a new bespoke table.
 * Row click destination matches the Cards view: `/dashboard/library/kcs/{pillarSlug}/{scrollSlug}`.
 */
export function KcsScrollsTable({ scrolls, pillarSlug, pillarName }: KcsScrollsTableProps) {
  const columns: Column<Category>[] = [
    {
      key: 'slug',
      label: 'Code',
      sortable: true,
      render: (s) => <span className="stat-chip">{s.slug}</span>,
    },
    {
      key: 'name',
      label: 'Title',
      sortable: true,
      render: (s) => (
        <Link
          href={`/dashboard/library/kcs/${pillarSlug}/${encodeURIComponent(s.slug)}`}
          aria-label={`View details for ${s.name.en}`}
          style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
        >
          {s.name.en}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (s) => {
        const status = s.status ?? 'AVAILABLE'
        return (
          <span style={{ fontSize: 9, fontWeight: 700, color: statusConfig[status].color, background: statusConfig[status].bg, borderRadius: 4, padding: '2px 7px' }}>
            {statusConfig[status].label}
          </span>
        )
      },
    },
  ]

  return (
    <DataTable
      data={scrolls}
      columns={columns}
      rowKey={(s) => s.id}
      searchPlaceholder={`Search scrolls in ${pillarName}...`}
      searchFilter={(s, q) => s.name.en.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)}
      emptyMessage="No scrolls found."
      caption={`${scrolls.length} scroll${scrolls.length !== 1 ? 's' : ''} in ${pillarName}`}
    />
  )
}
