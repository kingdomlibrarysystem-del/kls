/**
 * Shop types and small helpers shared by the API, server pages and client
 * components. Free of Prisma so client code can import it.
 */
export const SHOP_PERMISSION = 'shop:manage'

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED' | 'FAILED'
export type DeliveryMethod = 'PICKUP' | 'DELIVERY'

export interface ShopCategory {
  id: string
  name: string
  description: string | null
  sortOrder: number
  active: boolean
  productCount?: number
}

export interface ShopProduct {
  id: string
  title: string
  description: string
  priceRwf: number
  compareAtPriceRwf: number | null
  images: string[]
  categoryId: string
  categoryName: string
  stockQty: number
  status: ProductStatus
  soldCount: number
  inTrash: boolean
  createdAt: string
}

export interface ShopCartLine {
  productId: string
  title: string
  image: string | null
  unitPriceRwf: number
  quantity: number
  stockQty: number
  /** False when the product was archived/trashed or has no stock left — it can't be checked out. */
  available: boolean
}

export interface ShopCart {
  lines: ShopCartLine[]
  itemCount: number
  subtotalRwf: number
}

export interface ShopOrderItem {
  productId: string
  title: string
  image: string | null
  unitPriceRwf: number
  quantity: number
}

export interface ShopOrder {
  id: string
  orderNumber: string
  userId: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  items: ShopOrderItem[]
  subtotalRwf: number
  deliveryFeeRwf: number
  totalRwf: number
  deliveryMethod: DeliveryMethod
  deliveryAddress: string | null
  notes: string | null
  status: OrderStatus
  method: import('@/lib/payments/shared').PaymentMethodCode
  staffNote: string | null
  paidAt: string | null
  createdAt: string
}

/** Member-facing label + theme-token colour for each order status. */
export const ORDER_STATUS: Record<OrderStatus, { label: string; hint: string; cls: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', hint: 'Approve the payment on your phone, or retry.', cls: 'border-warning/30 bg-warning/10 text-warning' },
  PAID: { label: 'Paid', hint: 'We received your payment and will prepare your order.', cls: 'border-info/30 bg-info/10 text-info' },
  PROCESSING: { label: 'Preparing', hint: 'Your order is being prepared.', cls: 'border-info/30 bg-info/10 text-info' },
  READY_FOR_PICKUP: { label: 'Ready for pickup', hint: 'Your order is ready to collect.', cls: 'border-success/30 bg-success/10 text-success' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', hint: 'Your order is on its way.', cls: 'border-success/30 bg-success/10 text-success' },
  COMPLETED: { label: 'Completed', hint: 'Delivered / collected. Thank you!', cls: 'border-success/30 bg-success/10 text-success' },
  CANCELLED: { label: 'Cancelled', hint: 'This order was cancelled.', cls: 'border-border bg-muted text-muted-foreground' },
  FAILED: { label: 'Payment failed', hint: 'The payment did not go through. Nothing was charged.', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
}

/** The progress steps a member sees for an order, by delivery method. */
export function orderSteps(method: DeliveryMethod): OrderStatus[] {
  return method === 'DELIVERY'
    ? ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'OUT_FOR_DELIVERY', 'COMPLETED']
    : ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'COMPLETED']
}

/** Statuses staff may move a paid order to (in order). */
export const FULFILMENT_STATUSES: OrderStatus[] = ['PROCESSING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED']

export const formatRwf = (n: number) => `${Math.round(n).toLocaleString('en-US')} RWF`

/** Discount percent when a "was" price is higher, else null. */
export function discountPercent(p: { priceRwf: number; compareAtPriceRwf: number | null }): number | null {
  if (!p.compareAtPriceRwf || p.compareAtPriceRwf <= p.priceRwf) return null
  return Math.round(((p.compareAtPriceRwf - p.priceRwf) / p.compareAtPriceRwf) * 100)
}

export const MAX_QTY_PER_LINE = 99
