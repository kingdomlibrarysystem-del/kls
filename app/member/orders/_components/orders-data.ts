export type OrderType = 'SALE' | 'RENTAL'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

/** A member's own purchase/rental order, backed by the real Order model. */
export interface MemberOrder {
  id: string
  resourceId: string
  resourceTitle: string
  resourceFormat: string
  type: OrderType
  amount: number
  status: OrderStatus
  paypackStatus: string | null
  paidAt: string | null
  createdAt: string
}

export const typeConfig: Record<OrderType, { label: string }> = {
  SALE: { label: 'Purchase' },
  RENTAL: { label: 'Rental' },
}

export const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'var(--gold)' },
  paid: { label: 'Paid', color: 'var(--green-light)' },
  failed: { label: 'Failed', color: 'var(--red-light)' },
  cancelled: { label: 'Cancelled', color: 'var(--text-muted)' },
}
