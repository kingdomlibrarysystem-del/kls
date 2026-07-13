'use client'

import { useState } from 'react'
import { BookOpen, RotateCcw, AlertTriangle, Calendar, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'
import type { Borrowing } from './borrowings-data'
import { useBorrowings } from '../../_shared/use-borrowings'
import { BorrowingDetailModal } from './borrowing-detail-modal'

/** This member's borrowings: active/overdue list plus return history, each row opening a details modal. */
export function BorrowingsView() {
  const [viewing, setViewing] = useState<Borrowing | null>(null)
  const mockBorrowings = useBorrowings()
  const active = mockBorrowings.filter((b) => b.status === 'Active' || b.status === 'Overdue')
  const returned = mockBorrowings.filter((b) => b.status === 'Returned')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { icon: <BookOpen size={16} />, label: 'Active Loans', value: active.length.toString(), color: 'var(--gold)' },
          { icon: <AlertTriangle size={16} />, label: 'Overdue', value: active.filter((b) => b.status === 'Overdue').length.toString(), color: 'var(--red-light)' },
          { icon: <CheckCircle2 size={16} />, label: 'Returned', value: returned.length.toString(), color: 'var(--green-light)' },
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
          <RotateCcw size={14} color="var(--gold)" /> Currently Borrowed
        </div>
        {active.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>You have no active borrowings.</div>
        ) : (
          active.map((b) => {
            const isOverdue = b.status === 'Overdue'
            return (
              <button
                key={b.id}
                onClick={() => setViewing(b)}
                aria-label={`View details for ${b.title}`}
                className="w-full text-left"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                  <BookOpen size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{b.title}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{b.author}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, color: isOverdue ? 'var(--red-light)' : 'var(--green-light)', fontWeight: 600 }}>{b.status}</div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                    <Calendar size={10} /> Due {b.due}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </button>
            )
          })
        )}
      </div>

      {returned.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color="var(--text-muted)" /> Return History
          </div>
          {returned.map((b) => (
            <button
              key={b.id}
              onClick={() => setViewing(b)}
              aria-label={`View details for ${b.title}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                <BookOpen size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{b.title}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{b.author}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--green-light)' }}>Returned</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{b.returned}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <BorrowingDetailModal borrowing={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
