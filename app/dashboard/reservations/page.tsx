'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { initialData, hoursFromNow, type Reservation, type ReservationStatus } from './_components/reservations-data'
import { ReservationsStats } from './_components/reservations-stats'
import { ReservationsTable } from './_components/reservations-table'
import { ReservationDetailModal } from './_components/reservation-detail-modal'

/** Reservations Management: approval workflow (not a create-a-record page) plus a details view per row. */
export default function AdminReservationsPage() {
  const [data, setData] = useState<Reservation[]>(initialData)
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [toast, setToast] = useState('')
  const [viewing, setViewing] = useState<Reservation | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const updateRow = (id: string, patch: Partial<Reservation>) =>
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const handleNotify = (r: Reservation) => {
    const deadline = hoursFromNow(48)
    updateRow(r.id, { status: 'notified', notifiedAt: new Date().toISOString(), claimDeadline: deadline })
    showToast(`Notification sent to ${r.memberName} — 48h claim window started.`)
  }

  const handleConvertToBorrow = (r: Reservation) => {
    updateRow(r.id, { status: 'claimed' })
    showToast(`Reservation converted to active borrow for ${r.memberName}.`)
  }

  const handleCancel = (r: Reservation) => {
    updateRow(r.id, { status: 'cancelled', claimDeadline: null })
    setData((prev) => {
      const sameResource = prev
        .filter((x) => x.resourceId === r.resourceId && x.status === 'pending' && x.id !== r.id)
        .sort((a, b) => a.queuePosition - b.queuePosition)
      return prev.map((x) => {
        const idx = sameResource.findIndex((s) => s.id === x.id)
        return idx >= 0 ? { ...x, queuePosition: idx + 1 } : x
      })
    })
    showToast(`Reservation cancelled for ${r.memberName}. Queue updated.`)
  }

  const handleExpire = (r: Reservation) => {
    updateRow(r.id, { status: 'expired' })
    showToast(`Reservation expired for ${r.memberName}. Next in queue will be notified.`)
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
