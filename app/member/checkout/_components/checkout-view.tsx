'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle, XCircle, Loader2, Smartphone, ArrowLeft } from 'lucide-react'
import { UniversalButton } from '@/components/ui/universal-button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingCart } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/app/member/_shared/use-cart'
import { CheckoutItemList } from './checkout-item-list'
import { PaymentMethodSelector, type PaymentRail, type MobileMoneyProvider } from './payment-method-card'
import { parseSelectedItemIds } from './use-checkout-selection'

type Stage = 'review' | 'pending' | 'paid' | 'failed'

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 3 * 60_000

/**
 * Real combined checkout page — replaces BuyConfirmModal's per-item
 * modal for the cart flow (item #1/#2 of the redesign: one page, every
 * item shown with its image, pay all at once). Reads which cart items to
 * pay for from ?items=, starts one POST /api/checkout for all of them,
 * then polls GET /api/checkout/:id the same way the old modal polled
 * /api/orders/:id.
 */
export function CheckoutView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { data: cart, loading: cartLoading } = useCart(user?.id)

  const selectedIds = useMemo(() => parseSelectedItemIds(searchParams), [searchParams])
  const items = useMemo(() => cart.items.filter((i) => selectedIds.includes(i.id)), [cart.items, selectedIds])
  const totalRwf = items.reduce((sum, i) => sum + i.unitPriceRwf * i.quantity, 0)

  const [rail, setRail] = useState<PaymentRail>('PAYPACK')
  const [provider, setProvider] = useState<MobileMoneyProvider>('MTN')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stage, setStage] = useState<Stage>('review')
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (pollTimer.current) clearInterval(pollTimer.current) }, [])

  const startPolling = (id: string) => {
    const startedAt = Date.now()
    pollTimer.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setStage('failed')
        setError("We haven't received confirmation yet. Check My Orders later — it may still complete.")
        return
      }
      try {
        const res = await fetch(`/api/checkout/${id}`)
        const json = await res.json()
        if (json.data?.status === 'paid') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setStage('paid')
        } else if (json.data?.status === 'failed') {
          if (pollTimer.current) clearInterval(pollTimer.current)
          setStage('failed')
          setError('The payment was declined or failed.')
        }
      } catch {
        // Transient network error — let the next poll tick try again.
      }
    }, POLL_INTERVAL_MS)
  }

  const startCheckout = async () => {
    if (!user || items.length === 0) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cartItemIds: items.map((i) => i.id),
          buyerName: `${user.firstName} ${user.lastName}`.trim(),
          buyerEmail: user.email,
          buyerPhone: phone,
          method: rail,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not start the payment request.')

      if (rail === 'STRIPE' && json.data.checkoutUrl) {
        window.location.assign(json.data.checkoutUrl)
        return
      }
      setStage('pending')
      startPolling(json.data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the payment request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (cartLoading) {
    return <Skeleton style={{ height: 320, borderRadius: 8 }} />
  }

  if (items.length === 0 && stage === 'review') {
    return (
      <EmptyState icon={ShoppingCart} title="No items selected" description="Go back to your cart and choose what to pay for." style={{ color: 'var(--text-secondary)' }} />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      {stage === 'review' && (
        <>
          <UniversalButton href="/member/cart" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>Back to Cart</UniversalButton>
          <CheckoutItemList items={items} />

          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Order total</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{totalRwf.toLocaleString()} RWF</div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Payment method</div>
            <PaymentMethodSelector rail={rail} onRailChange={setRail} provider={provider} onProviderChange={setProvider} />

            {rail === 'PAYPACK' && (
              <div>
                <label htmlFor="checkout-phone" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {provider === 'MTN' ? 'MTN' : 'Airtel'} Mobile Money Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="checkout-phone" type="tel" inputMode="numeric" placeholder="078xxxxxxx" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 13 }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              onClick={startCheckout}
              disabled={submitting || (rail === 'PAYPACK' && !phone.trim())}
              style={{ padding: '11px 16px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Pay {totalRwf.toLocaleString()} RWF
            </button>
          </div>
        </>
      )}

      {stage === 'pending' && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--gold)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Check your phone</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Approve the mobile money prompt sent to {phone} to complete this purchase.</p>
          <UniversalButton href="/member/orders" variant="gold-outline" size="sm">Close and check later</UniversalButton>
        </div>
      )}

      {stage === 'paid' && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <CheckCircle2 size={32} style={{ margin: '0 auto 12px', color: 'var(--green-light)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Payment confirmed</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Your order for {items.length} {items.length === 1 ? 'item' : 'items'} is complete.</p>
          <UniversalButton href="/member/orders" variant="gold" size="sm">View My Orders</UniversalButton>
        </div>
      )}

      {stage === 'failed' && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <XCircle size={32} style={{ margin: '0 auto 12px', color: 'var(--red-light)' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Payment not completed</div>
          {error && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{error}</p>}
          <UniversalButton href="/member/orders" variant="gold-outline" size="sm">Go to My Orders to retry</UniversalButton>
        </div>
      )}
    </div>
  )
}
