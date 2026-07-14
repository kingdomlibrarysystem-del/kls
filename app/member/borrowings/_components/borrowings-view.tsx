'use client'

import { useState, useEffect } from 'react'
import { BookOpen, RotateCcw, AlertTriangle, Calendar, ChevronRight, Clock, CheckCircle2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { Borrowing } from './borrowings-data'
import { useBorrowings } from '../../_shared/use-borrowings'
import { BorrowingDetailModal } from './borrowing-detail-modal'

/** Simulated network delay before mock borrowings become visible. */
const LOAD_DELAY_MS = 400

/** This member's borrowings: active/overdue list plus return history, each row opening a details modal. */
export function BorrowingsView() {
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Borrowing | null>(null)
  const mockBorrowings = useBorrowings()
  const active = mockBorrowings.filter((b) => b.status === 'Active' || b.status === 'Overdue')
  const returned = mockBorrowings.filter((b) => b.status === 'Returned')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading borrowings">
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
          <EmptyState icon={BookOpen} title="No active borrowings" description="Books you borrow will appear here until they're returned." style={{ color: 'var(--text-secondary)' }} />
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
