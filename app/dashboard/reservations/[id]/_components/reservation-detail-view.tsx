'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, BookOpen, Calendar, Layers, Clock, ArrowLeft, Bell, ArrowRightCircle, XCircle, AlertTriangle, CalendarClock } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, type Reservation } from '../../_components/reservations-data'
import { QueueBadge, ClaimCountdown } from '../../_components/reservation-helpers'
import { notifyReservation, convertReservationToBorrow, cancelReservation, expireReservation } from '../../_components/use-reservations-admin'

interface ReservationDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing). */
  initialReservation: Reservation
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single reservation, replacing the modal that
 * used to open from the Reservations table's "View" button. The record
 * arrives from the server page; after an action it re-reads
 * /api/reservations/:id so queue/status changes show up. It keeps the same admin
 * notify/convert-to-borrow/cancel/expire actions the list page exposed,
 * since those are workflow mutations rather than the "view details"
 * modal being replaced.
 */
export function ReservationDetailView({ initialReservation }: ReservationDetailViewProps) {
  const id = initialReservation.id
  const router = useRouter()
  const [reservation, setReservation] = useState<Reservation | null>(initialReservation)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState('')

  /** Re-reads the reservation after a workflow action (the initial copy comes from the server). Keeps the last known copy if the refresh fails. */
  const load = () =>
    fetch(`/api/reservations/${id}`)
      .then((res) => res.json())
      .then((json) => { if (json.code === 'success' && json.data) setReservation(json.data) })
      .catch(() => {})

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const runAction = async (action: (id: string) => Promise<Reservation>, successMsg: string, failMsg: string) => {
    setActionLoading(true)
    try {
      await action(id)
      showToast(successMsg)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : failMsg)
    } finally {
      setActionLoading(false)
    }
  }

  if (!reservation) {
    return (
      <div>
        <PageHeader title="Reservation Details" />
        <EmptyState icon={CalendarClock} title="Reservation not found" description="This reservation does not exist or was removed." />
        <div className="mt-4">
          <UniversalButton href="/dashboard/reservations" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Reservations
          </UniversalButton>
        </div>
      </div>
    )
  }

  const r = reservation
  const available = r.totalCopies - r.borrowedCopies

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/reservations" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Reservations
        </UniversalButton>
        <div className="flex gap-2 flex-wrap justify-end">
          {r.status === 'pending' && r.queuePosition === 1 && available > 0 && (
            <UniversalButton
              variant="outline"
              size="sm"
              icon={<Bell size={13} />}
              loading={actionLoading}
              onClick={() => runAction(notifyReservation, `Notification sent to ${r.memberName} — 48h claim window started.`, 'Could not notify this member')}
            >
              Notify
            </UniversalButton>
          )}
          {r.status === 'pending' && (
            <UniversalButton
              variant="outline"
              size="sm"
              icon={<XCircle size={13} />}
              loading={actionLoading}
              onClick={() => runAction(cancelReservation, `Reservation cancelled for ${r.memberName}. Queue updated.`, 'Could not cancel this reservation')}
            >
              Cancel
            </UniversalButton>
          )}
          {r.status === 'notified' && (
            <>
              <UniversalButton
                variant="primary"
                size="sm"
                icon={<ArrowRightCircle size={13} />}
                loading={actionLoading}
                onClick={() => runAction(convertReservationToBorrow, `Reservation converted to active borrow for ${r.memberName}.`, 'Could not convert this reservation')}
              >
                Convert to Borrow
              </UniversalButton>
              <UniversalButton
                variant="outline"
                size="sm"
                icon={<AlertTriangle size={13} />}
                loading={actionLoading}
                onClick={() => runAction(expireReservation, `Reservation expired for ${r.memberName}. Next in queue will be notified.`, 'Could not expire this reservation')}
              >
                Expire
              </UniversalButton>
            </>
          )}
        </div>
      </div>

      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{r.resourceTitle}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[r.status].cls}`}>
            {statusConfig[r.status].label}
          </span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Member" value={r.memberName} />
          <DetailRow icon={<Mail size={13} />} label="Email" value={r.memberEmail} />
          <DetailRow icon={<BookOpen size={13} />} label="Resource" value={`${r.resourceAuthor} · ${r.resourceType}`} />
          <DetailRow icon={<Layers size={13} />} label="Stock" value={`${available} of ${r.totalCopies} available`} />
          <DetailRow icon={<Calendar size={13} />} label="Reserved" value={r.reservationDate} />
          {['pending', 'notified'].includes(r.status) && (
            <DetailRow icon={<Layers size={13} />} label="Queue" value={<QueueBadge position={r.queuePosition} />} />
          )}
          {r.status === 'notified' && r.claimDeadline && (
            <DetailRow icon={<Clock size={13} />} label="Claim By" value={<ClaimCountdown deadline={r.claimDeadline} />} />
          )}
        </div>
      </div>
    </div>
  )
}
