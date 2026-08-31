'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Trash2, Tag, AlertTriangle, Check } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { useAuth } from '@/contexts/auth-context'
import { useCart, removeFromCart, confirmCartItem, type CartItemType, type CartItem } from '../../_shared/use-cart'
import { AccessOrderCheckoutModal } from '@/app/(public)/library/_components/access-order-checkout-modal'

const typeLabel: Record<CartItemType, string> = { SALE: 'Buy', RENTAL: 'Rent', BORROW: 'Borrow', RESERVE: 'Reserve' }

/**
 * Real cart review page — one line per CartItem, real remove action, a
 * live running total (SALE/RENTAL only — see /api/cart's totalRwf).
 * BORROW/RESERVE items get a real "Confirm" action instead of a price
 * when Settings.borrowingFee/reservationFee is 0 (the default) — those
 * aren't a payment, so confirming calls /api/cart/[itemId]/confirm
 * directly, which creates the real Borrow/Reservation row via the same
 * route the direct (non-cart) buttons use. Once a fee is set, that same
 * confirm call now 400s (see /api/borrowings and /api/reservations'
 * fee gate), so the button instead opens AccessOrderCheckoutModal —
 * paying removes the cart item itself via the settlement side effect,
 * not this page's own remove call. SALE/RENTAL checkout is not yet
 * wired to a real payment call (Stripe test-mode keys aren't configured
 * in this environment yet — see PROGRESS.md); that button says so
 * honestly rather than pretending to charge anything.
 */
export function CartView() {
  const { user } = useAuth()
  const { data: cart, loading } = useCart(user?.id)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [fees, setFees] = useState<{ borrowingFee: number; reservationFee: number } | null>(null)
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((json) => { if (json.data) setFees({ borrowingFee: json.data.borrowingFee ?? 0, reservationFee: json.data.reservationFee ?? 0 }) })
      .catch(() => setFees({ borrowingFee: 0, reservationFee: 0 }))
  }, [])

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

  const feeFor = (item: CartItem) => (item.type === 'BORROW' ? fees?.borrowingFee ?? 0 : item.type === 'RESERVE' ? fees?.reservationFee ?? 0 : 0)

  const handleConfirm = async (item: CartItem) => {
    if (!user) return
    if (feeFor(item) > 0) {
      setCheckoutItem(item)
      return
    }
    setConfirmingId(item.id)
    setError('')
    try {
      await confirmCartItem(item.id, user.id)
      setConfirmedIds((prev) => new Set(prev).add(item.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm this request')
    } finally {
      setConfirmingId(null)
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
            {item.type === 'BORROW' || item.type === 'RESERVE' ? (
              confirmedIds.has(item.id) ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--green-light)' }}>
                  <Check size={14} /> Confirmed
                </span>
              ) : (
                <button
                  onClick={() => handleConfirm(item)}
                  disabled={confirmingId === item.id || fees === null}
                  style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: confirmingId === item.id ? 'default' : 'pointer', opacity: confirmingId === item.id ? 0.6 : 1 }}
                >
                  {confirmingId === item.id
                    ? 'Confirming…'
                    : feeFor(item) > 0
                      ? `Pay & ${typeLabel[item.type]} — ${feeFor(item).toLocaleString()} RWF`
                      : `Confirm ${typeLabel[item.type]}`}
                </button>
              )
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {(item.unitPriceRwf * item.quantity).toLocaleString()} RWF
              </div>
            )}
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

      {cart.items.some((i) => i.type === 'SALE' || i.type === 'RENTAL') && (
        <>
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total to pay (Buy/Rent items)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{cart.totalRwf.toLocaleString()} RWF</div>
            </div>
            <UniversalButton variant="gold" disabled title="Checkout is not yet connected to a real payment provider in this environment">
              Proceed to Checkout
            </UniversalButton>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Checkout isn&apos;t live yet in this environment — it will charge via Stripe (test mode) once configured. Borrow/Reserve items above confirm directly, unless a borrowing/reservation fee is set — those pay first.
          </p>
        </>
      )}

      <AccessOrderCheckoutModal
        kind={checkoutItem ? (checkoutItem.type === 'BORROW' ? 'BORROW' : 'RESERVATION') : null}
        resourceId={checkoutItem?.resourceId ?? ''}
        bookTitle={checkoutItem?.resourceTitle ?? ''}
        feeRwf={checkoutItem ? feeFor(checkoutItem) : 0}
        onClose={() => setCheckoutItem(null)}
        onSettled={() => {
          if (checkoutItem) {
            setConfirmedIds((prev) => new Set(prev).add(checkoutItem.id))
            // Best-effort cleanup — settling the AccessOrder already created the
            // real Borrow/Reservation row; this only removes the now-stale cart
            // line so it doesn't look re-payable. A failure here just leaves a
            // confirmed-but-still-listed cart row, not a lost payment.
            removeFromCart(checkoutItem.id, user?.id ?? '').catch(() => {})
          }
          setCheckoutItem(null)
        }}
      />
    </div>
  )
}
