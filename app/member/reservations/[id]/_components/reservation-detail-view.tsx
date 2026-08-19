'use client'

import { useEffect, useState } from 'react'
import { User, CalendarDays, Users, CheckCircle2, Hash, ArrowLeft, CalendarX } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, type Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

interface ReservationDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--gold)', marginTop: 2 }} className="shrink-0">{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 70 }} className="shrink-0">{label}</span>
      <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single reservation, replacing the modal that
 * used to open from the member reservations list's row click. Fetches
 * directly from /api/reservations/:id so this page also works when
 * linked to directly, without the list being loaded first.
 */
export function ReservationDetailView({ id }: ReservationDetailViewProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/reservations/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Reservation not found')
          return
        }
        setReservation(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load reservation') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading reservation">
        <Skeleton style={{ height: 32, width: 160, borderRadius: 8 }} />
        <Skeleton style={{ height: 160, borderRadius: 8 }} />
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState icon={CalendarX} title="Reservation not found" description={error || 'This reservation does not exist or was removed.'} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <UniversalButton href="/member/reservations" variant="gold-outline" icon={<ArrowLeft size={16} />}>
            Back to Reservations
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UniversalButton href="/member/reservations" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>
        Back to Reservations
      </UniversalButton>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{reservation.resourceTitle}</h3>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{statusConfig[reservation.status].label}</span>
        </div>

        <div className="card space-y-2">
          <DetailRow icon={<User size={15} />} label="Author" value={reservation.resourceAuthor} />
          <DetailRow icon={<CalendarDays size={15} />} label="Reserved" value={reservation.reservationDate} />
          {reservation.status === 'pending' && reservation.queuePosition > 0 && (
            <DetailRow icon={<Users size={15} />} label="Queue" value={`Position ${reservation.queuePosition}`} />
          )}
          {reservation.claimDeadline && <DetailRow icon={<CheckCircle2 size={15} />} label="Claim by" value={new Date(reservation.claimDeadline).toLocaleString()} />}
          <DetailRow icon={<Hash size={15} />} label="ID" value={reservation.id} />
        </div>
      </div>
    </div>
  )
}
