export type TransactionType = 'SALE' | 'RENTAL'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

/** Real Order, backed by the Order collection and a genuine PayPack mobile-money charge — replaces the fully mocked Transaction[] this file used to hold. */
export interface Transaction {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  resourceId: string
  resourceTitle: string
  resourceFormat: string
  type: TransactionType
  amount: number
  status: OrderStatus
  paypackRef: string | null
  date: string
}

export const typeConfig: Record<TransactionType, { label: string; cls: string }> = {
  SALE: { label: 'Sale', cls: 'bg-green-50 text-green-800 border-green-200' },
  RENTAL: { label: 'Rental', cls: 'bg-teal-50  text-teal-800  border-teal-200' },
}

export const statusConfig: Record<OrderStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  paid: { label: 'Paid', cls: 'bg-green-50 text-green-800 border-green-200' },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-800 border-red-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-w-100 text-w-700 border-w-300' },
}
