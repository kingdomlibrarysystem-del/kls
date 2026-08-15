'use client'

import { useState } from 'react'
import { ShoppingBag, Clock, CheckCircle2, XCircle, ChevronRight, Coins } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useOrders } from '../../_shared/use-orders'
import { typeConfig, statusConfig, type MemberOrder } from './orders-data'
import { OrderDetailModal } from './order-detail-modal'

/** This member's orders: pending payments plus completed/failed history, each row opening a details modal. */
export function OrdersView() {
  const { data: orders, loading } = useOrders()
  const [viewing, setViewing] = useState<MemberOrder | null>(null)
  const pending = orders.filter((o) => o.status === 'pending')
  const settled = orders.filter((o) => o.status !== 'pending')
  const paidTotal = orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading orders">
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
          { icon: <Clock size={16} />, label: 'Pending', value: pending.length.toString(), color: 'var(--gold)' },
          { icon: <CheckCircle2 size={16} />, label: 'Completed', value: orders.filter((o) => o.status === 'paid').length.toString(), color: 'var(--green-light)' },
          { icon: <Coins size={16} />, label: 'Total Paid', value: `${paidTotal.toLocaleString()} RWF`, color: 'var(--gold)' },
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
          <Clock size={14} color="var(--gold)" /> Pending Payments
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No pending orders" description="Payment requests you send from the library will appear here until confirmed." style={{ color: 'var(--text-secondary)' }} />
        ) : (
          pending.map((o) => (
            <button
              key={o.id}
              onClick={() => setViewing(o)}
              aria-label={`View details for order ${o.resourceTitle}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                <ShoppingBag size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{o.resourceTitle}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{typeConfig[o.type].label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 600 }}>Pending</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>{o.amount.toLocaleString()} RWF</div>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </button>
          ))
        )}
      </div>

      {settled.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="var(--text-muted)" /> Order History
          </div>
          {settled.map((o) => (
            <button
              key={o.id}
              onClick={() => setViewing(o)}
              aria-label={`View details for order ${o.resourceTitle}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                {o.status === 'paid' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{o.resourceTitle}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{typeConfig[o.type].label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: statusConfig[o.status].color }}>{statusConfig[o.status].label}</div>
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{o.amount.toLocaleString()} RWF</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <OrderDetailModal order={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
