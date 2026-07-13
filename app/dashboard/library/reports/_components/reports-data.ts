// ── Mock data for Borrow Reports (APP_DOC Task 4.5) ────────────────────────────
// GET /reports/overdue, GET /reports/top-resources, GET /reports/fines

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

export const overdueList: OverdueEntry[] = [
  { id: 'ov-001', memberName: 'Amina Uwimana',    resourceTitle: 'Digital Transformation',  dueDate: '2026-05-24', daysOverdue: 12 },
  { id: 'ov-002', memberName: 'Eric Habimana',     resourceTitle: 'Ancient Civilizations',   dueDate: '2026-06-01', daysOverdue: 6  },
  { id: 'ov-003', memberName: 'Grace Mukamana',    resourceTitle: 'World History Essentials', dueDate: '2026-06-10', daysOverdue: 3 },
]

export const topResources: TopResourceEntry[] = [
  { id: 'tr-001', title: 'The Pursuit of Knowledge',          category: 'Philosophy', borrowCount: 34 },
  { id: 'tr-002', title: 'Introduction to Web Development',   category: 'Technology', borrowCount: 29 },
  { id: 'tr-003', title: 'Digital Transformation',             category: 'Technology', borrowCount: 25 },
  { id: 'tr-004', title: 'Ancient Civilizations',               category: 'History',   borrowCount: 21 },
  { id: 'tr-005', title: 'World History Essentials',            category: 'History',   borrowCount: 18 },
]

export const fineCollection: FineEntry[] = [
  { id: 'fn-001', memberName: 'Amina Uwimana',    resourceTitle: 'Digital Transformation',  daysOverdue: 12, amount: 2400, status: 'UNPAID' },
  { id: 'fn-002', memberName: 'Eric Habimana',     resourceTitle: 'Ancient Civilizations',   daysOverdue: 6,  amount: 1200, status: 'PAID'   },
  { id: 'fn-003', memberName: 'Grace Mukamana',    resourceTitle: 'World History Essentials', daysOverdue: 3, amount: 600,  status: 'UNPAID' },
  { id: 'fn-004', memberName: 'David Ndayisenga',  resourceTitle: 'Modern Art & Culture',    daysOverdue: 5,  amount: 1000, status: 'WAIVED' },
]
