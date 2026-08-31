'use client'

import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable, type Column } from '@/components/ui/data-table'
import { statusConfig, type Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

interface CategoryBorrowingsSectionProps {
  borrowings: Borrowing[]
}

/** Real Borrowings for resources filed under this category — joined client-side via each Borrowing's real resourceId against this category's resource-id set (no server-side categoryId filter exists on /api/borrowings today). */
export function CategoryBorrowingsSection({ borrowings }: CategoryBorrowingsSectionProps) {
  if (borrowings.length === 0) {
    return <EmptyState icon={BookOpen} title="No borrowings yet" description="No member has borrowed a resource from this category." style={{ color: 'var(--text-secondary)' }} />
  }

  const columns: Column<Borrowing>[] = [
    { key: 'memberName', label: 'Member', sortable: true, render: (b) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.memberName}</span> },
    { key: 'resourceTitle', label: 'Resource', sortable: true, render: (b) => b.resourceTitle },
    { key: 'borrowDate', label: 'Borrowed', sortable: true, render: (b) => b.borrowDate },
    { key: 'dueDate', label: 'Due', sortable: true, render: (b) => b.dueDate },
    {
      key: 'status', label: 'Status',
      render: (b) => <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${statusConfig[b.status].cls}`}>{statusConfig[b.status].label}</span>,
    },
  ]

  return (
    <DataTable
      data={borrowings}
      columns={columns}
      rowKey={(b) => b.id}
      emptyMessage="No borrowings found."
      caption={`${borrowings.length} borrowing${borrowings.length !== 1 ? 's' : ''}`}
    />
  )
}
