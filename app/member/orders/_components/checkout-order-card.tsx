'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, RotateCw, X, Loader2, ChevronRight } from 'lucide-react'
import { RemoteImage } from '@/components/ui/remote-image'
import { statusConfig, typeConfig, type MemberCheckout } from './orders-data'

interface CheckoutOrderCardProps {
  checkout: MemberCheckout
  onChanged: () => void
}

/**
 * One combined-checkout row in My Orders — item thumbnails (redesign
 * item #4: "show item image under my order") plus real retry/cancel
 * actions for a PENDING or FAILED checkout (item #4's other half),
 * calling POST /api/checkout/:id/retry and /cancel. A retry reuses the
 * same PayPack rail/phone by default (no method switch UI here — the
 * member already chose that at checkout time; a full method change is
 * a "start a new checkout" action, out of scope for a quick retry).
 */
export function CheckoutOrderCard({ checkout, onChanged }: CheckoutOrderCardProps) {
  const [busy, setBusy] = useState<'retry' | 'cancel' | null>(null)
  const [error, setError] = useState('')
  const canAct = checkout.status === 'pending' || checkout.status === 'failed'

  const handleRetry = async () => {
    setBusy('retry')
    setError('')
    try {
      const res = await fetch(`/api/checkout/${checkout.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: checkout.method }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not retry payment')
      if (json.data?.checkoutUrl) {
        window.location.assign(json.data.checkoutUrl)
        return
      }
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not retry payment')
    } finally {
      setBusy(null)
    }
  }

  const handleCancel = async () => {
    setBusy('cancel')
    setError('')
    try {
      const res = await fetch(`/api/checkout/${checkout.id}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Could not cancel order')
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel order')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-light)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Link
        href={`/member/orders/checkout/${checkout.id}`}
        style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}
      >
        <div style={{ display: 'flex', marginRight: 4 }}>
          {checkout.items.slice(0, 3).map((item, i) => (
            <div key={item.id} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-section)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', overflow: 'hidden', border: '2px solid var(--bg-card)', marginLeft: i > 0 ? -12 : 0 }}>
              <RemoteImage src={item.resourceCover} alt={item.resourceTitle} fill sizes="36px" className="object-cover" fallback={<ShoppingBag size={16} />} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {checkout.items.length === 1 ? checkout.items[0].resourceTitle : `${checkout.items.length} items`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {checkout.items.length === 1 ? typeConfig[checkout.items[0].type].label : checkout.items.map((i) => typeConfig[i.type].label).join(', ')}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: statusConfig[checkout.status].color, fontWeight: 600 }}>{statusConfig[checkout.status].label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{checkout.amount.toLocaleString()} RWF</div>
        </div>
        <ChevronRight size={16} color="var(--text-muted)" />
      </Link>

      {error && <div style={{ fontSize: 11, color: 'var(--red-light)' }}>{error}</div>}

      {canAct && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleRetry}
            disabled={busy !== null}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy === 'retry' ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />} Retry payment
          </button>
          <button
            onClick={handleCancel}
            disabled={busy !== null}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            {busy === 'cancel' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Cancel
          </button>
        </div>
      )}
    </div>
  )
}
