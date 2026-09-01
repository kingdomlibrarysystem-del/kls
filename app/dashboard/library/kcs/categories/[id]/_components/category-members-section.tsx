'use client'

import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable, type Column } from '@/components/ui/data-table'

export interface CategoryMemberRow {
  memberId: string
  memberName: string
  memberEmail: string
  borrowCount: number
  reservationCount: number
}

interface CategoryMembersSectionProps {
  members: CategoryMemberRow[]
}

/** Distinct members who have borrowed or reserved a resource from this category — derived client-side from real Borrowing/Reservation rows (no dedicated "category interest" model exists), same join-then-dedup approach the rest of this page's sections use. */
export function CategoryMembersSection({ members }: CategoryMembersSectionProps) {
  if (members.length === 0) {
    return <EmptyState icon={Users} title="No members yet" description="No member has borrowed or reserved a resource from this category." style={{ color: 'var(--text-secondary)' }} />
  }

  const columns: Column<CategoryMemberRow>[] = [
    { key: 'memberName', label: 'Member', sortable: true, render: (m) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.memberName}</span> },
    { key: 'memberEmail', label: 'Email', sortable: true, render: (m) => m.memberEmail },
    { key: 'borrowCount', label: 'Borrowings', sortable: true, render: (m) => m.borrowCount },
    { key: 'reservationCount', label: 'Reservations', sortable: true, render: (m) => m.reservationCount },
  ]

  return (
    <DataTable
      data={members}
      columns={columns}
      rowKey={(m) => m.memberId}
      emptyMessage="No members found."
      caption={`${members.length} member${members.length !== 1 ? 's' : ''}`}
    />
  )
}
