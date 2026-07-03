'use client'

import { useState } from 'react'
import { CalendarDays, BookOpen, Clock, CheckCircle2 } from 'lucide-react'
import type { Reservation } from './reservations-data'
import { useReservations } from '../../_shared/use-reservations'
import { ReservationDetailModal } from './reservation-detail-modal'

/** This member's reservations: active/waiting list plus fulfilled history, each row opening a details modal. */
export function ReservationsView() {
  const [viewing, setViewing] = useState<Reservation | null>(null)
  const mockReservations = useReservations()
  const active = mockReservations.filter((r) => r.status !== 'Fulfilled')
  const fulfilled = mockReservations.filter((r) => r.status === 'Fulfilled')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: <CalendarDays size={16} />, label: 'Active Reservations', value: active.length.toString(), color: 'var(--gold)' },
          { icon: <CheckCircle2 size={16} />, label: 'Ready for Pickup', value: active.filter((r) => r.status === 'Ready').length.toString(), color: 'var(--green-light)' },
          { icon: <Clock size={16} />, label: 'Fulfilled', value: fulfilled.length.toString(), color: 'var(--gold)' },
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
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>No active reservations.</div>
        ) : (
          active.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
              <button
                onClick={() => setViewing(r)}
                aria-label={`View details for ${r.title}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: r.status === 'Ready' ? 'var(--green-dim)' : 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {r.status === 'Ready' ? <CheckCircle2 size={16} color="var(--green-light)" /> : <Clock size={16} color="var(--gold)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.author} • Reserved {r.reserved}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: r.status === 'Ready' ? 'var(--green-light)' : 'var(--gold)', fontWeight: 600 }}>{r.status}</div>
                  {!!r.queue && r.queue > 0 && <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{r.queue} ahead of you</div>}
                </div>
              </button>
              {r.status === 'Ready' && (
                <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  Borrow
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {fulfilled.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="var(--gold)" /> Fulfilled Reservations
          </div>
          {fulfilled.map((r) => (
            <button
              key={r.id}
              onClick={() => setViewing(r)}
              aria-label={`View details for ${r.title}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="var(--text-muted)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.author}</div>
              </div>
              <div style={{ fontSize: 9, color: 'var(--green-light)' }}>Fulfilled {r.fulfilled}</div>
            </button>
          ))}
        </div>
      )}

      <ReservationDetailModal reservation={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
