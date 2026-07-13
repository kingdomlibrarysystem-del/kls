/** A member's own borrowing record. */
export type BorrowingStatus = 'Active' | 'Overdue' | 'Returned'

export interface Borrowing {
  id: number
  title: string
  author: string
  borrowed: string
  due: string
  status: BorrowingStatus
  returned?: string
}

export const mockBorrowings: Borrowing[] = [
  { id: 1, title: 'Kingdom Principles', author: 'Dr. Elias Nkubito', borrowed: 'Jun 10, 2026', due: 'Jun 24, 2026', status: 'Active' },
  { id: 2, title: 'The Power of Purpose', author: 'Dr. Elias Nkubito', borrowed: 'Jun 15, 2026', due: 'Jun 29, 2026', status: 'Active' },
  { id: 3, title: 'Understanding Divine Direction', author: 'Dr. Elias Nkubito', borrowed: 'May 20, 2026', due: 'Jun 03, 2026', status: 'Overdue' },
  { id: 4, title: 'Kingdom Leadership', author: 'Dr. Elias Nkubito', borrowed: 'Apr 01, 2026', due: 'Apr 15, 2026', status: 'Returned', returned: 'Apr 14, 2026' },
  { id: 5, title: 'The Culture of the Kingdom', author: 'Dr. Elias Nkubito', borrowed: 'Mar 10, 2026', due: 'Mar 24, 2026', status: 'Returned', returned: 'Mar 22, 2026' },
]
