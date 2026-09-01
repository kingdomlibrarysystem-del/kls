export type OrderType = 'SALE' | 'RENTAL'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

/** A member's own purchase/rental order, backed by the real Order model. */
export interface MemberOrder {
  id: string
  resourceId: string
  resourceTitle: string
  resourceFormat: string
  resourceCover: string | null
  type: OrderType
  amount: number
  status: OrderStatus
  checkoutId: string | null
  paypackStatus: string | null
  paidAt: string | null
  createdAt: string
}

/** One line item inside a combined Checkout — see MemberCheckout. */
export interface MemberCheckoutItem {
  id: string
  resourceId: string
  resourceTitle: string
  resourceCover: string | null
  type: OrderType
  amount: number
  status: OrderStatus
}

/** A member's own combined payment, backed by the real Checkout model — groups one or more Orders paid together in one PayPack cashin or Stripe session. */
export interface MemberCheckout {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  method: 'PAYPACK' | 'STRIPE'
  amount: number
  status: OrderStatus
  paypackRef: string | null
  paypackStatus: string | null
  stripeSessionId: string | null
  retryCount: number
  paidAt: string | null
  createdAt: string
  items: MemberCheckoutItem[]
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
