'use client'

import { ShoppingCart, Tag } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import type { CartItem, CartItemType } from '@/app/member/_shared/use-cart'

const typeLabel: Record<CartItemType, string> = { SALE: 'Reserve', RENTAL: 'Borrow' }

interface CheckoutItemListProps {
  items: CartItem[]
}

/** Every item being paid for, each with its real cover image — item #2 of the redesign ("make all items are there with images"). */
export function CheckoutItemList({ items }: CheckoutItemListProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
        {items.length} {items.length === 1 ? 'item' : 'items'}
      </div>
      {items.map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--bg-section)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0, overflow: 'hidden' }}>
            <RemoteImage src={item.resourceCover} alt={item.resourceTitle} fill sizes="52px" className="object-cover" fallback={<ShoppingCart size={22} />} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.resourceTitle}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Tag size={11} /> {typeLabel[item.type]} · by {item.resourceAuthor}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
            {(item.unitPriceRwf * item.quantity).toLocaleString()} RWF
          </div>
        </div>
      ))}
    </div>
  )
}
