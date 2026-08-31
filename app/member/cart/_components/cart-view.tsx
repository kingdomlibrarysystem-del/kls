'use client'

import { useState } from 'react'
import { ShoppingCart, Trash2, Tag, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { useCart, removeFromCart, type CartItemType, type CartItem } from '../../_shared/use-cart'
import { BuyConfirmModal, type BuyAction } from '@/app/(public)/library/_components/buy-confirm-modal'

const typeLabel: Record<CartItemType, string> = { SALE: 'Reserve', RENTAL: 'Borrow' }

/**
 * Real cart review page — one line per CartItem, real remove action.
 * Cart is the only way to place a Reserve (SALE) or Borrow (RENTAL)
 * request: every item is a real charge, paid per-item via the same
 * single-resource PayPack checkout (BuyConfirmModal, POST /api/orders)
 * the public library's direct Reserve/Borrow buttons already use — this
 * page just launches that same modal from a cart row instead of a book
 * card. The Reservation/Borrow row itself is only created once the
 * Order settles PAID (see app/api/orders/settle.ts); this page removes
 * the cart line once that happens.
 */
export function CartView() {
  const { user } = useAuth()
  const { data: cart, loading } = useCart(user?.id)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null)

  const handleRemove = async (itemId: string) => {
    if (!user) return
    setRemovingId(itemId)
    setError('')
    try {
      await removeFromCart(itemId, user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this item')
    } finally {
      setRemovingId(null)
    }
  }

  const handlePaid = () => {
    if (checkoutItem && user) removeFromCart(checkoutItem.id, user.id).catch(() => {})
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Loading cart">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} style={{ height: 72, borderRadius: 8 }} />)}
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Add a book from the library to Reserve or Borrow it."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {cart.items.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-light)' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0, overflow: 'hidden' }}>
              {item.resourceCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.resourceCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ShoppingCart size={20} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.resourceTitle}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Tag size={12} /> {typeLabel[item.type]} · by {item.resourceAuthor}
              </div>
            </div>
            <button
              onClick={() => setCheckoutItem(item)}
              style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Pay & {typeLabel[item.type]} — {(item.unitPriceRwf * item.quantity).toLocaleString()} RWF
            </button>
            <button
              onClick={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              aria-label={`Remove ${item.resourceTitle} from cart`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-light)', display: 'flex', alignItems: 'center', opacity: removingId === item.id ? 0.5 : 1 }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total across all items</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{cart.totalRwf.toLocaleString()} RWF</div>
      </div>

      <BuyConfirmModal
        action={checkoutItem ? (checkoutItem.type as BuyAction) : null}
        resourceId={checkoutItem?.resourceId ?? ''}
        bookTitle={checkoutItem?.resourceTitle ?? ''}
        priceRwf={checkoutItem?.unitPriceRwf ?? 0}
        onClose={() => setCheckoutItem(null)}
        onPaid={handlePaid}
      />
    </div>
  )
}
