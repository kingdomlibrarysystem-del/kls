'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingBag, Coins, Calendar, CheckCircle2, Hash, CreditCard, Smartphone, RotateCw, X, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, type MemberCheckout } from '../../../_components/orders-data'
import { CheckoutDetailItems } from './checkout-detail-items'

interface CheckoutDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--gold)', marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

/**
 * Full detail page for one combined Checkout — every item with its
 * image (CheckoutDetailItems), plus buyer/payment metadata this app's
 * old single-Order detail page never had a multi-item equivalent of,
 * and real retry/cancel actions matching CheckoutOrderCard's (My
 * Orders' collapsed row has no room for all of this, hence a real page).
 */
export function CheckoutDetailView({ id }: CheckoutDetailViewProps) {
  const [checkout, setCheckout] = useState<MemberCheckout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'retry' | 'cancel' | null>(null)
  const [actionError, setActionError] = useState('')

  const load = () => {
    fetch(`/api/checkout/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.code !== 'success' || !json.data) { setError(json.message ?? 'Order not found'); return }
        setCheckout(json.data)
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleRetry = async () => {
    if (!checkout) return
    setBusy('retry')
    setActionError('')
    try {
      const res = await fetch(`/api/checkout/${checkout.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: checkout.method }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not retry payment')
      if (json.data?.checkoutUrl) { window.location.assign(json.data.checkoutUrl); return }
      setCheckout(json.data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not retry payment')
    } finally {
      setBusy(null)
    }
  }

  const handleCancel = async () => {
    if (!checkout) return
    setBusy('cancel')
    setActionError('')
    try {
      const res = await fetch(`/api/checkout/${checkout.id}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not cancel order')
      setCheckout(json.data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel order')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading order">
        <Skeleton style={{ height: 32, width: 160, borderRadius: 6 }} />
        <Skeleton style={{ height: 240, borderRadius: 8 }} />
      </div>
    )
  }

  if (error || !checkout) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState icon={ShoppingBag} title="Order not found" description={error || 'This order does not exist or was removed.'} style={{ color: 'var(--text-secondary)' }} />
        <div><UniversalButton href="/member/orders" variant="gold-outline" icon={<ArrowLeft size={16} />}>Back to My Orders</UniversalButton></div>
      </div>
    )
  }

  const canAct = checkout.status === 'pending' || checkout.status === 'failed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <UniversalButton href="/member/orders" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>Back to My Orders</UniversalButton>

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {checkout.items.length === 1 ? checkout.items[0].resourceTitle : `Order · ${checkout.items.length} items`}
        </h1>
        <span style={{ fontSize: 13, fontWeight: 700, color: statusConfig[checkout.status].color, flexShrink: 0 }}>{statusConfig[checkout.status].label}</span>
      </div>

      <CheckoutDetailItems items={checkout.items} />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <DetailRow icon={<Coins size={15} />} label="Total" value={`${checkout.amount.toLocaleString()} RWF`} />
        <DetailRow icon={checkout.method === 'PAYPACK' ? <Smartphone size={15} /> : <CreditCard size={15} />} label="Payment method" value={checkout.method === 'PAYPACK' ? `Mobile Money (${checkout.buyerPhone || 'n/a'})` : 'Card'} />
        <DetailRow icon={<Calendar size={15} />} label="Ordered" value={new Date(checkout.createdAt).toLocaleString()} />
        {checkout.paidAt && <DetailRow icon={<CheckCircle2 size={15} />} label="Paid" value={new Date(checkout.paidAt).toLocaleString()} />}
        {checkout.retryCount > 0 && <DetailRow icon={<RotateCw size={15} />} label="Retries" value={String(checkout.retryCount)} />}
        <DetailRow icon={<Hash size={15} />} label="Order ID" value={checkout.id} />
      </div>

      {actionError && (
        <div style={{ background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>{actionError}</div>
      )}

      {canAct && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleRetry}
            disabled={busy !== null}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy === 'retry' ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />} Retry payment
          </button>
          <button
            onClick={handleCancel}
            disabled={busy !== null}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy === 'cancel' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Cancel order
          </button>
        </div>
      )}
    </div>
  )
}
