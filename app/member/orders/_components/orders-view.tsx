'use client'

import { ShoppingBag, Clock, CheckCircle2, Coins } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useCheckouts } from '../../_shared/use-checkouts'
import { CheckoutOrderCard } from './checkout-order-card'

/** This member's combined checkouts: pending/failed payments (with retry/cancel) plus completed history, each showing every item's thumbnail. Replaces the old one-row-per-Order list now that checkout is combined. */
export function OrdersView() {
  const { data: checkouts, loading, refetch } = useCheckouts()
  const pending = checkouts.filter((c) => c.status === 'pending' || c.status === 'failed')
  const settled = checkouts.filter((c) => c.status === 'paid' || c.status === 'cancelled')
  const paidTotal = checkouts.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)

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
          { icon: <Clock size={18} />, label: 'Pending', value: pending.length.toString(), color: 'var(--gold)' },
          { icon: <CheckCircle2 size={18} />, label: 'Completed', value: checkouts.filter((c) => c.status === 'paid').length.toString(), color: 'var(--green-light)' },
          { icon: <Coins size={18} />, label: 'Total Paid', value: `${paidTotal.toLocaleString()} RWF`, color: 'var(--gold)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={16} color="var(--gold)" /> Pending Payments
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No pending orders" description="Payment requests you start from your cart will appear here until confirmed." style={{ color: 'var(--text-secondary)' }} />
        ) : (
          pending.map((c) => <CheckoutOrderCard key={c.id} checkout={c} onChanged={refetch} />)
        )}
      </div>

      {settled.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="var(--text-muted)" /> Order History
          </div>
          {settled.map((c) => <CheckoutOrderCard key={c.id} checkout={c} onChanged={refetch} />)}
        </div>
      )}
    </div>
  )
}
