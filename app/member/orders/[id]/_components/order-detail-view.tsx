'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingBag, Tag, Coins, Calendar, CheckCircle2, Hash } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { RemoteImage } from '@/components/ui/remote-image'
import { useLanguage } from '@/contexts/language-context'
import { typeConfig, statusConfig, type MemberOrder } from '../../_components/orders-data'

interface OrderDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialOrder: MemberOrder
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--gold)', marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }} suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single order (purchase or rental), replacing
 * the modal that used to open from the member orders list. The stored
 * order is loaded on the server by page.tsx; only a still-pending order is
 * re-read from /api/orders/:id (which re-polls PayPack/Stripe) after mount.
 */
export function OrderDetailView({ initialOrder }: OrderDetailViewProps) {
  const { t } = useLanguage()
  const [order, setOrder] = useState<MemberOrder | null>(initialOrder)

  // The stored state came from the server page. Only while payment is still
  // pending does the route have anything new (it re-polls the payment
  // provider), so refresh once in that case instead of on every visit.
  useEffect(() => {
    if (!(initialOrder.status === 'pending')) return
    let cancelled = false
    fetch(`C:/Program Files/Git/api/orders/${initialOrder.id}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled && json.code === 'success' && json.data) setOrder(json.data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [initialOrder])

  if (!order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={ShoppingBag}
          title={t('m_orders.not_found')}
          description={t('m_orders.not_found_desc')}
          style={{ color: 'var(--text-secondary)' }}
        />
        <div>
          <UniversalButton href="/member/orders" variant="gold-outline" icon={<ArrowLeft size={16} />}>
            {t('m_orders.back')}
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UniversalButton href="/member/orders" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>
        {t('m_orders.back')}
      </UniversalButton>

      <div className="card space-y-4" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-section)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0, overflow: 'hidden' }}>
            <RemoteImage src={order.resourceCover} alt={order.resourceTitle} fill sizes="48px" className="object-cover" fallback={<ShoppingBag size={20} />} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {order.resourceTitle}
            </h1>
            <span style={{ fontSize: 13, fontWeight: 700, color: statusConfig[order.status].color, flexShrink: 0 }}>
              {statusConfig[order.status].label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <DetailRow icon={<Tag size={15} />} label={t('m_orders.type')} value={typeConfig[order.type].label} />
          <DetailRow icon={<Coins size={15} />} label={t('m_orders.amount')} value={`${order.amount.toLocaleString()} RWF`} />
          <DetailRow icon={<Calendar size={15} />} label={t('m_orders.ordered')} value={order.createdAt} />
          {order.paidAt && <DetailRow icon={<CheckCircle2 size={15} />} label={t('m_orders.paid')} value={order.paidAt.split('T')[0]} />}
          <DetailRow icon={<Hash size={15} />} label={t('m_orders.order_id')} value={order.id} />
        </div>
      </div>
    </div>
  )
}
