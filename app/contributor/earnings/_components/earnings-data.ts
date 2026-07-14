/**
 * A single payout, per APP_DOC Task 5.4 / Prisma `Transaction`. No admin-side
 * equivalent exists anywhere in this app (no payment/payout processing page
 * — confirmed via the same "no payments/subscription data model" finding
 * documented in final-quality-audit.md's Batch 4), so payout history stays
 * contributor-local mock data rather than a cross-role store. Per-publication
 * revenue itself is NOT duplicated here anymore — see earnings-view.tsx,
 * which now reads the real, shared `useRevenue()` store (the same one
 * `/dashboard/publishing/revenue` renders) filtered to this contributor,
 * instead of this file's own frozen copy.
 */
export type PayoutStatus = 'PENDING' | 'PAID'

export interface PayoutRow {
  id: string
  date: string
  amount: number
  method: string
  status: PayoutStatus
}

export const payoutHistory: PayoutRow[] = [
  { id: 'pay-001', date: '2026-04-05', amount: 96600, method: 'Mobile Money', status: 'PAID' },
  { id: 'pay-002', date: '2026-05-05', amount: 114400, method: 'Bank Transfer', status: 'PAID' },
  { id: 'pay-003', date: '2026-06-05', amount: 171500, method: 'Mobile Money', status: 'PENDING' },
]

export const payoutStatusConfig: Record<PayoutStatus, { label: string; cls: string; bg: string; color: string; border: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', bg: 'var(--gold-light)', color: '#7a5c00',     border: 'var(--gold)'  },
  PAID:    { label: 'Paid',    cls: 'bg-green-50  text-green-800  border-green-200',  bg: 'var(--green-dim)', color: 'var(--green)', border: 'var(--green)' },
}
