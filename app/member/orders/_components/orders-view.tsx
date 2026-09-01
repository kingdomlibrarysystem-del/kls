'use client'

import { ShoppingBag, Clock, CheckCircle2, XCircle, ChevronRight, Coins } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useOrders } from '../../_shared/use-orders'
import { useLanguage } from '@/contexts/language-context'
import { typeConfig, statusConfig } from './orders-data'

/** This member's orders: pending payments plus completed/failed history, each row linking to its details page. */
export function OrdersView() {
  const { t } = useLanguage()
  const { data: orders, loading } = useOrders()
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
          { icon: <Clock size={18} />, label: t('m_orders.pending'), value: pending.length.toString(), color: 'var(--gold)' },
          { icon: <CheckCircle2 size={18} />, label: t('m_orders.completed'), value: orders.filter((o) => o.status === 'paid').length.toString(), color: 'var(--green-light)' },
          { icon: <Coins size={18} />, label: t('m_orders.total_paid'), value: `${paidTotal.toLocaleString()} RWF`, color: 'var(--gold)' },
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
          <Clock size={16} color="var(--gold)" /> {t('m_orders.pending_payments')}
        </div>
        {pending.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t('m_orders.no_pending')} description={t('m_orders.no_pending_desc')} style={{ color: 'var(--text-secondary)' }} />
        ) : (
          pending.map((o) => (
            <UniversalButton
              key={o.id}
              href={`/member/orders/${o.id}`}
              variant="gold-outline"
              aria-label={`View details for order ${o.resourceTitle}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border-light)', border: 'none', borderRadius: 0 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0 }}>
                <ShoppingBag size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{o.resourceTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typeConfig[o.type].label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>{t('m_orders.pending')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{o.amount.toLocaleString()} RWF</div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </UniversalButton>
          ))
        )}
      </div>

      {settled.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} color="var(--text-muted)" /> {t('m_orders.order_history')}
          </div>
          {settled.map((o) => (
            <UniversalButton
              key={o.id}
              href={`/member/orders/${o.id}`}
              variant="dim-outline"
              aria-label={`View details for order ${o.resourceTitle}`}
              className="w-full text-left"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: '1px solid var(--border-light)', border: 'none', borderRadius: 0 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                {o.status === 'paid' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{o.resourceTitle}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typeConfig[o.type].label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: statusConfig[o.status].color }}>{statusConfig[o.status].label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{o.amount.toLocaleString()} RWF</div>
              </div>
            </UniversalButton>
          ))}
        </div>
      )}
    </div>
  )
}
