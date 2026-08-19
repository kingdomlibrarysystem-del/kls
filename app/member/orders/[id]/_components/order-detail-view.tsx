'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ShoppingBag, Tag, Coins, Calendar, CheckCircle2, Hash } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { typeConfig, statusConfig, type MemberOrder } from '../../_components/orders-data'

interface OrderDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--gold)', marginTop: 2 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single order (purchase or rental), replacing
 * the modal that used to open from the member orders list. Fetches
 * directly from /api/orders/:id so this page also works when linked to
 * directly, and picks up any PayPack status refresh that endpoint does.
 */
export function OrderDetailView({ id }: OrderDetailViewProps) {
  const [order, setOrder] = useState<MemberOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Order not found')
          return
        }
        setOrder(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load order') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading order">
        <Skeleton style={{ height: 32, width: 160, borderRadius: 6 }} />
        <Skeleton style={{ height: 160, borderRadius: 8 }} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <EmptyState
          icon={ShoppingBag}
          title="Order not found"
          description={error || 'This order does not exist or was removed.'}
          style={{ color: 'var(--text-secondary)' }}
        />
        <div>
          <UniversalButton href="/member/orders" variant="gold-outline" icon={<ArrowLeft size={16} />}>
            Back to My Orders
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UniversalButton href="/member/orders" variant="dim-outline" size="sm" icon={<ArrowLeft size={16} />}>
        Back to My Orders
      </UniversalButton>

      <div className="card space-y-4" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 className="cinzel" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {order.resourceTitle}
          </h1>
          <span style={{ fontSize: 13, fontWeight: 700, color: statusConfig[order.status].color, flexShrink: 0 }}>
            {statusConfig[order.status].label}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <DetailRow icon={<Tag size={15} />} label="Type" value={typeConfig[order.type].label} />
          <DetailRow icon={<Coins size={15} />} label="Amount" value={`${order.amount.toLocaleString()} RWF`} />
          <DetailRow icon={<Calendar size={15} />} label="Ordered" value={order.createdAt} />
          {order.paidAt && <DetailRow icon={<CheckCircle2 size={15} />} label="Paid" value={order.paidAt.split('T')[0]} />}
          <DetailRow icon={<Hash size={15} />} label="Order ID" value={order.id} />
        </div>
      </div>
    </div>
  )
}
