'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2, Tag, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { RemoteImage } from '@/components/ui/remote-image'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { useCart, removeFromCart, type CartItemType } from '../../_shared/use-cart'

const typeLabel: Record<CartItemType, string> = { SALE: 'Reserve', RENTAL: 'Borrow' }

/**
 * Real cart review page — every item is a real charge (SALE = Reserve,
 * RENTAL = Borrow), but checkout is now combined: instead of one "Pay &
 * Reserve/Borrow" button per row, every item is checkbox-selectable and
 * a single "Pay Selected" action navigates to /member/checkout with the
 * chosen cart item ids, where they're all paid in one transaction (see
 * app/member/checkout). Replaces the old per-item BuyConfirmModal flow.
 */
export function CartView() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { data: cart, loading } = useCart(user?.id)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const selectedItems = useMemo(() => cart.items.filter((i) => selected.has(i.id)), [cart.items, selected])
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.unitPriceRwf * i.quantity, 0)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRemove = async (itemId: string) => {
    if (!user) return
    setRemovingId(itemId)
    setError('')
    try {
      await removeFromCart(itemId, user.id)
      setSelected((prev) => { const next = new Set(prev); next.delete(itemId); return next })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this item')
    } finally {
      setRemovingId(null)
    }
  }

  const handlePaySelected = () => {
    if (selectedItems.length === 0) return
    router.push(`/member/checkout?items=${selectedItems.map((i) => i.id).join(',')}`)
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
        title={t('m_cart.empty')}
        description={t('m_cart.empty_desc')}
        style={{ color: 'var(--text-secondary)' }}
      />
    )
  }

  const allSelected = selected.size === cart.items.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(cart.items.map((i) => i.id)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--red-dim)', color: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: 'var(--gold)', cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select all</span>
        </div>
        {cart.items.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-light)' }}
          >
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              style={{ width: 15, height: 15, accentColor: 'var(--gold)', cursor: 'pointer', flexShrink: 0 }}
            />
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-section)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', flexShrink: 0, overflow: 'hidden' }}>
              <RemoteImage
                src={item.resourceCover}
                alt={item.resourceTitle}
                fill
                sizes="44px"
                className="object-cover"
                fallback={<ShoppingCart size={20} />}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.resourceTitle}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Tag size={12} /> {typeLabel[item.type]} · by {item.resourceAuthor}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
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

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {selected.size > 0 ? `${selected.size} selected` : 'Total across all items'}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            {(selected.size > 0 ? selectedTotal : cart.totalRwf).toLocaleString()} RWF
          </div>
        </div>
        <button
          onClick={handlePaySelected}
          disabled={selected.size === 0}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: selected.size === 0 ? 'not-allowed' : 'pointer', opacity: selected.size === 0 ? 0.5 : 1 }}
        >
          Pay {selected.size > 0 ? `Selected (${selected.size})` : 'All'}
        </button>
      </div>
    </div>
  )
}
