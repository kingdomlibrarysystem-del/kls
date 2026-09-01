'use client'

import { ShoppingBag, Tag } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { statusConfig, typeConfig, type MemberCheckoutItem } from '../../../_components/orders-data'

/** Every item in this checkout, each with its cover image, type, per-item status, and price — the detail-level breakdown My Orders' collapsed row doesn't show. */
export function CheckoutDetailItems({ items }: { items: MemberCheckoutItem[] }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </div>
      {items.map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--bg-section)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0, overflow: 'hidden' }}>
            <RemoteImage src={item.resourceCover} alt={item.resourceTitle} fill sizes="52px" className="object-cover" fallback={<ShoppingBag size={22} />} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.resourceTitle}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Tag size={11} /> {typeConfig[item.type].label}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{item.amount.toLocaleString()} RWF</div>
            <div style={{ fontSize: 11, color: statusConfig[item.status].color, marginTop: 1 }}>{statusConfig[item.status].label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
