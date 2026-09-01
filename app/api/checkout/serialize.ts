interface CheckoutOrder {
  id: string
  resourceId: string
  resourceTitle: string
  resourceCover: string | null
  type: string
  amountRwf: number
  status: string
}

interface CheckoutRecord {
  id: string
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  method: string
  amountRwf: number
  status: string
  paypackRef: string | null
  paypackStatus: string | null
  stripeSessionId: string | null
  retryCount: number
  paidAt: Date | null
  createdAt: Date
  orders: CheckoutOrder[]
}

/** Shared response shape for every /api/checkout* route — a Checkout plus its line-item Orders, so a client never needs a second round trip to show what's being paid for. */
export function serializeCheckout(c: CheckoutRecord) {
  return {
    id: c.id,
    userId: c.userId,
    buyerName: c.buyerName,
    buyerEmail: c.buyerEmail,
    buyerPhone: c.buyerPhone,
    method: c.method,
    amount: c.amountRwf,
    status: c.status.toLowerCase(),
    paypackRef: c.paypackRef,
    paypackStatus: c.paypackStatus,
    stripeSessionId: c.stripeSessionId,
    retryCount: c.retryCount,
    paidAt: c.paidAt ? c.paidAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    items: c.orders.map((o) => ({
      id: o.id,
      resourceId: o.resourceId,
      resourceTitle: o.resourceTitle,
      resourceCover: o.resourceCover,
      type: o.type,
      amount: o.amountRwf,
      status: o.status.toLowerCase(),
    })),
  }
}
