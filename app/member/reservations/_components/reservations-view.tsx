'use client'

import { useState } from 'react'
import { CalendarDays, BookOpen, Clock, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { Reservation } from '@/app/dashboard/reservations/_components/reservations-data'
import { useReservations } from '../../_shared/use-reservations'
import { ReservationDetailModal } from './reservation-detail-modal'

/** This member's reservations: active/waiting list plus claimed history, each row opening a details modal. Claiming a notified reservation happens in person via staff — see /api/reservations' convertToBorrow action — so this view is read-only. */
export function ReservationsView() {
  const { data: reservations, loading } = useReservations()
  const [viewing, setViewing] = useState<Reservation | null>(null)
  const active = reservations.filter((r) => r.status === 'pending' || r.status === 'notified')
  const done = reservations.filter((r) => r.status === 'claimed' || r.status === 'expired' || r.status === 'cancelled')

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading reservations">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} style={{ height: 64, borderRadius: 8 }} />)}
        </div>
        <Skeleton style={{ height: 160, borderRadius: 8 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: <CalendarDays size={16} />, label: 'Active Reservations', value: active.length.toString(), color: 'var(--gold)' },
          { icon: <CheckCircle2 size={16} />, label: 'Ready for Pickup', value: active.filter((r) => r.status === 'notified').length.toString(), color: 'var(--green-light)' },
          { icon: <Clock size={16} />, label: 'Claimed', value: done.filter((r) => r.status === 'claimed').length.toString(), color: 'var(--gold)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalendarDays size={14} color="var(--gold)" /> Active Reservations
        </div>
        {active.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No active reservations" description="Books you reserve will appear here while you wait for a copy." style={{ color: 'var(--text-secondary)' }} />
        ) : (
          active.map((r) => (
            <button
              key={r.id}
              onClick={() => setViewing(r)}
              aria-label={`View details for ${r.resourceTitle}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: r.status === 'notified' ? 'var(--green-dim)' : 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.status === 'notified' ? <CheckCircle2 size={16} color="var(--green-light)" /> : <Clock size={16} color="var(--gold)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{r.resourceTitle}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.resourceAuthor} • Reserved {r.reservationDate}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: r.status === 'notified' ? 'var(--green-light)' : 'var(--gold)', fontWeight: 600 }}>
                  {r.status === 'notified' ? 'Ready — Claim in person' : `Position ${r.queuePosition}`}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {done.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="var(--gold)" /> Past Reservations
          </div>
          {done.map((r) => (
            <button
              key={r.id}
              onClick={() => setViewing(r)}
              aria-label={`View details for ${r.resourceTitle}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{r.resourceTitle}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.resourceAuthor}</div>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</div>
            </button>
          ))}
        </div>
      )}

      <ReservationDetailModal reservation={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
