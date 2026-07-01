/** Per-book revenue split, per APP_DOC Task 5.4 / Prisma `RevenueShare`. */
export interface BookRevenueRow {
  id: string
  publication: string
  contributorShare: number
  platformShare: number
  totalRevenue: number
  contributorEarnings: number
}

/** A single payout, per APP_DOC Task 5.4 / Prisma `Transaction`. */
export type PayoutStatus = 'PENDING' | 'PAID'

export interface PayoutRow {
  id: string
  date: string
  amount: number
  method: string
  status: PayoutStatus
}

/** Mock revenue/payout data for the signed-in contributor ("Pastor Emmanuel Rugamba"). */
export const bookRevenue: BookRevenueRow[] = [
  { id: 'rev-001', publication: 'Walking in Covenant', contributorShare: 70, platformShare: 30, totalRevenue: 245000, contributorEarnings: 171500 },
  { id: 'rev-004', publication: 'Leading with Humility', contributorShare: 70, platformShare: 30, totalRevenue: 138000, contributorEarnings: 96600 },
  { id: 'rev-006', publication: 'The Weight of Servant Leadership', contributorShare: 65, platformShare: 35, totalRevenue: 176000, contributorEarnings: 114400 },
]

export const payoutHistory: PayoutRow[] = [
  { id: 'pay-001', date: '2026-04-05', amount: 96600, method: 'Mobile Money', status: 'PAID' },
  { id: 'pay-002', date: '2026-05-05', amount: 114400, method: 'Bank Transfer', status: 'PAID' },
  { id: 'pay-003', date: '2026-06-05', amount: 171500, method: 'Mobile Money', status: 'PENDING' },
]

export const payoutStatusConfig: Record<PayoutStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  PAID:    { label: 'Paid',    cls: 'bg-green-50  text-green-800  border-green-200'  },
}
