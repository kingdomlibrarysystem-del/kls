'use client'

import { Bookmark } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable, type Column } from '@/components/ui/data-table'
import { statusConfig, type Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

interface CategoryReservationsSectionProps {
  reservations: Reservation[]
}

/** Real Reservations for resources filed under this category — /api/reservations already supports a real resourceId filter, so this is a genuine categoryId-derived join, not a title-string match. */
export function CategoryReservationsSection({ reservations }: CategoryReservationsSectionProps) {
  if (reservations.length === 0) {
    return <EmptyState icon={Bookmark} title="No reservations yet" description="No member has reserved a resource from this category." style={{ color: 'var(--text-secondary)' }} />
  }

  const columns: Column<Reservation>[] = [
    { key: 'memberName', label: 'Member', sortable: true, render: (r) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.memberName}</span> },
    { key: 'resourceTitle', label: 'Resource', sortable: true, render: (r) => r.resourceTitle },
    { key: 'queuePosition', label: 'Queue #', sortable: true, render: (r) => r.queuePosition },
    { key: 'reservationDate', label: 'Reserved', sortable: true, render: (r) => r.reservationDate },
    {
      key: 'status', label: 'Status',
      render: (r) => <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${statusConfig[r.status].cls}`}>{statusConfig[r.status].label}</span>,
    },
  ]

  return (
    <DataTable
      data={reservations}
      columns={columns}
      rowKey={(r) => r.id}
      emptyMessage="No reservations found."
      caption={`${reservations.length} reservation${reservations.length !== 1 ? 's' : ''}`}
    />
  )
}
