'use client'

import { useState } from 'react'
import { ShoppingCart, Trash2, Tag, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuth } from '@/contexts/auth-context'
import { useCart, removeFromCart } from '../../_shared/use-cart'

const typeLabel = { SALE: 'Buy', RENTAL: 'Rent' } as const

/**
 * Real cart review page — one line per CartItem, real remove action,
 * a live running total. Checkout is not yet wired to a real payment
 * call (Stripe test-mode keys aren't configured in this environment
 * yet — see PROGRESS.md); the button below says so honestly rather
 * than pretending to charge anything.
 */
export function CartView() {
  const { user } = useAuth()
  const { data: cart, loading } = useCart(user?.id)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')

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
        description="Add a book from the library to start a real checkout."
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
          <AlertTriangle size={13} /> {error}
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
                <ShoppingCart size={18} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.resourceTitle}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Tag size={10} /> {typeLabel[item.type]} · by {item.resourceAuthor}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {(item.unitPriceRwf * item.quantity).toLocaleString()} RWF
            </div>
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
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{cart.totalRwf.toLocaleString()} RWF</div>
        </div>
        <UniversalButton variant="gold" disabled title="Checkout is not yet connected to a real payment provider in this environment">
          Proceed to Checkout
        </UniversalButton>
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
        Checkout isn&apos;t live yet in this environment — it will charge via Stripe (test mode) once configured.
      </p>
    </div>
  )
}
