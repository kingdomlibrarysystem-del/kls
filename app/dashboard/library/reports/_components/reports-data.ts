// Real Borrow Reports types (APP_DOC Task 4.5) — the rows themselves
// are now computed live in /api/reports/library from the real Borrow
// collection (see use-library-reports.ts), not seeded here.

export interface OverdueEntry {
  id: string
  memberName: string
  resourceTitle: string
  dueDate: string
  daysOverdue: number
}

export interface TopResourceEntry {
  id: string
  title: string
  category: string
  borrowCount: number
}

export type FineStatus = 'UNPAID' | 'PAID' | 'WAIVED'

export interface FineEntry {
  id: string
  memberName: string
  resourceTitle: string
  daysOverdue: number
  amount: number
  status: FineStatus
}
