'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { Reservation, ReservationStatus } from './_components/reservations-data'
import { useReservationsAdmin, notifyReservation, convertReservationToBorrow, cancelReservation, expireReservation } from './_components/use-reservations-admin'
import { ReservationsStats } from './_components/reservations-stats'
import { ReservationsTable } from './_components/reservations-table'
import { ReservationDetailModal } from './_components/reservation-detail-modal'

/** Reservations Management: approval workflow (not a create-a-record page) plus a details view per row. */
export default function AdminReservationsPage() {
  const { data, loading, error } = useReservationsAdmin()
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [toast, setToast] = useState('')
  const [viewing, setViewing] = useState<Reservation | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading reservations">
        <Skeleton style={{ height: 60, borderRadius: 8 }} />
        <Skeleton style={{ height: 300, borderRadius: 8 }} />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load reservations" description={error} />
  }

  const handleNotify = async (r: Reservation) => {
    try {
      await notifyReservation(r.id)
      showToast(`Notification sent to ${r.memberName} — 48h claim window started.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not notify this member')
    }
  }

  const handleConvertToBorrow = async (r: Reservation) => {
    try {
      await convertReservationToBorrow(r.id)
      showToast(`Reservation converted to active borrow for ${r.memberName}.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not convert this reservation')
    }
  }

  const handleCancel = async (r: Reservation) => {
    try {
      await cancelReservation(r.id)
      showToast(`Reservation cancelled for ${r.memberName}. Queue updated.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not cancel this reservation')
    }
  }

  const handleExpire = async (r: Reservation) => {
    try {
      await expireReservation(r.id)
      showToast(`Reservation expired for ${r.memberName}. Next in queue will be notified.`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not expire this reservation')
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Reservations Management" subtitle="Manage the waiting queue — notify members, convert to borrows, track claim windows" />

      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <ReservationsStats data={data} />

      <div className="bg-w-50 border border-w-200 rounded-lg px-5 py-3 mb-5">
        <p className="font-cinzel text-xs font-semibold text-w-950 mb-1.5">Reservation Workflow</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-lato text-xs text-w-700">
          <span>1. Member reserves unavailable resource → <strong>Waiting</strong></span>
          <span>2. Copy returned → Notify #1 in queue → <strong>Notified</strong></span>
          <span>3. Member claims within 48h → <strong>Convert to Borrow</strong></span>
          <span>4. No claim after 48h → <strong>Expire</strong> → notify next in queue</span>
        </div>
      </div>

      <ReservationsTable
        data={data}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onView={setViewing}
        onNotify={handleNotify}
        onConvertToBorrow={handleConvertToBorrow}
        onCancel={handleCancel}
        onExpire={handleExpire}
      />

      <ReservationDetailModal reservation={viewing} onClose={() => setViewing(null)} />
    </PageTransition>
  )
}
