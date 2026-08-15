'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Smartphone, BookOpen, DollarSign, Calendar, Tag, Hash, ArrowLeft, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { typeConfig, statusConfig, type Transaction } from '../../_components/sales-data'

interface TransactionDetailViewProps {
  id: string
}

interface OrderDetail extends Transaction {
  paidAt: string | null
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/**
 * Real details page for a single Order (sale/rental), replacing the
 * modal that used to open from the Sales & Rentals table's "View"
 * button. Fetches directly from /api/orders/:id — that route also
 * re-polls PayPack for pending orders — rather than reading the row
 * out of the already-loaded admin list.
 */
export function TransactionDetailView({ id }: TransactionDetailViewProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
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
          setError(json.message ?? 'Transaction not found')
          return
        }
        setOrder(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load transaction') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div>
        <PageHeader title="Transaction Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        <PageHeader title="Transaction Details" />
        <EmptyState icon={AlertTriangle} title="Transaction not found" description={error || 'This transaction does not exist.'} />
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
