'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Smartphone, BookOpen, DollarSign, Calendar, Tag, Hash, ArrowLeft, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { typeConfig, statusConfig, type Transaction } from '../../_components/sales-data'

interface TransactionDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialOrder: OrderDetail
}

export interface OrderDetail extends Transaction {
  paidAt: string | null
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single Order (sale/rental), replacing the
 * modal that used to open from the Sales & Rentals table's "View"
 * button. The stored order is loaded on the server by page.tsx; only a
 * still-pending order is re-read from /api/orders/:id (which re-polls
 * PayPack/Stripe) after mount.
 */
export function TransactionDetailView({ initialOrder }: TransactionDetailViewProps) {
  const [order, setOrder] = useState<OrderDetail | null>(initialOrder)

  // The stored state came from the server page. Only while payment is still
  // pending does the route have anything new (it re-polls the payment
  // provider), so refresh once in that case instead of on every visit.
  useEffect(() => {
    if (!(initialOrder.status === 'pending')) return
    let cancelled = false
    fetch(`C:/Program Files/Git/api/orders/${initialOrder.id}`)
      .then((res) => res.json())
      .then((json) => { if (!cancelled && json.code === 'success' && json.data) setOrder(json.data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [initialOrder])

  if (!order) {
    return (
      <div>
        <PageHeader title="Transaction Details" />
        <EmptyState icon={AlertTriangle} title="Transaction not found" description={'This transaction does not exist.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/library/sales" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Sales & Rentals
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/library/sales" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Sales & Rentals
        </UniversalButton>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{order.resourceTitle}</h1>
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${typeConfig[order.type].cls}`}>
              {typeConfig[order.type].label}
            </span>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[order.status].cls}`}>
              {statusConfig[order.status].label}
            </span>
          </div>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Buyer" value={order.buyerName} />
          <DetailRow icon={<Mail size={13} />} label="Email" value={order.buyerEmail} />
          <DetailRow icon={<Smartphone size={13} />} label="Phone" value={order.buyerPhone} />
          <DetailRow icon={<BookOpen size={13} />} label="Format" value={order.resourceFormat} />
          <DetailRow icon={<Tag size={13} />} label="ID" value={order.id} />
          {order.paypackRef && <DetailRow icon={<Hash size={13} />} label="PayPack Ref" value={order.paypackRef} />}
          <DetailRow icon={<DollarSign size={13} />} label="Amount" value={`${order.amount.toLocaleString()} RWF`} />
          <DetailRow icon={<Calendar size={13} />} label="Created" value={order.date} />
          {order.paidAt && <DetailRow icon={<Calendar size={13} />} label="Paid At" value={new Date(order.paidAt).toLocaleString()} />}
        </div>
      </div>
    </div>
  )
}
