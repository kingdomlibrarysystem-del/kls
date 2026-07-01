export type BorrowStatus = 'pending' | 'active' | 'overdue' | 'returned' | 'rejected'

export interface Borrowing {
  id: string
  memberId: string
  memberName: string
  memberEmail: string
  resourceTitle: string
  resourceType: string
  isbn: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: BorrowStatus
  renewalCount: number
  fineAmount: number | null
  finePaid: boolean
}

export const statusConfig: Record<BorrowStatus, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  active: { label: 'Active', cls: 'bg-green-50  text-green-800  border-green-200' },
  overdue: { label: 'Overdue', cls: 'bg-red-50    text-red-800    border-red-200' },
  returned: { label: 'Returned', cls: 'bg-w-50      text-w-700      border-w-300' },
  rejected: { label: 'Rejected', cls: 'bg-w-100     text-w-600      border-w-300' },
}

export function daysOverdue(dueDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000))
}

export const initialData: Borrowing[] = [
  { id: 'b-001', memberId: 'u-101', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com', resourceTitle: 'The Pursuit of Knowledge', resourceType: 'Book', isbn: '978-1234567890', borrowDate: '2025-06-01', dueDate: '2025-06-15', returnDate: null, status: 'active', renewalCount: 1, fineAmount: null, finePaid: false },
  { id: 'b-002', memberId: 'u-102', memberName: 'Amina Uwimana', memberEmail: 'amina@example.com', resourceTitle: 'Digital Transformation', resourceType: 'E-Book', isbn: '978-0987654321', borrowDate: '2025-05-10', dueDate: '2025-05-24', returnDate: null, status: 'overdue', renewalCount: 2, fineAmount: 1500, finePaid: false },
]
