export type BorrowStatus = 'pending' | 'active' | 'overdue' | 'returned' | 'rejected'

export interface Borrowing {
  id: string
  memberId: string
  memberName: string
  memberEmail: string
  resourceId: string
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
  { id: 'b-001', memberId: 'u-101', memberName: 'Jean Paul Nkurunziza', memberEmail: 'jeanpaul@example.com', resourceId: 'res-1', resourceTitle: 'The Pursuit of Knowledge', resourceType: 'Book', isbn: '978-1234567890', borrowDate: '2025-06-01', dueDate: '2025-06-15', returnDate: null, status: 'active', renewalCount: 1, fineAmount: null, finePaid: false },
  { id: 'b-002', memberId: 'u-102', memberName: 'Amina Uwimana', memberEmail: 'amina@example.com', resourceId: 'res-2', resourceTitle: 'Digital Transformation', resourceType: 'E-Book', isbn: '978-0987654321', borrowDate: '2025-05-10', dueDate: '2025-05-24', returnDate: null, status: 'overdue', renewalCount: 2, fineAmount: 1500, finePaid: false },
  { id: 'b-003', memberId: 'u-103', memberName: 'Eric Habimana', memberEmail: 'eric@example.com', resourceId: 'res-3', resourceTitle: 'Ancient Civilizations', resourceType: 'Book', isbn: '978-1111111111', borrowDate: '2025-06-05', dueDate: '2025-06-19', returnDate: null, status: 'active', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-004', memberId: 'u-104', memberName: 'Grace Mukamana', memberEmail: 'grace@example.com', resourceId: 'res-4', resourceTitle: 'Foundations of Faith', resourceType: 'Book', isbn: '978-2222222222', borrowDate: '2025-04-12', dueDate: '2025-04-26', returnDate: '2025-04-24', status: 'returned', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-005', memberId: 'u-105', memberName: 'Claudine Ingabire', memberEmail: 'claudine@example.com', resourceId: 'res-5', resourceTitle: 'Leading with Humility', resourceType: 'E-Book', isbn: '978-3333333333', borrowDate: '2025-06-10', dueDate: '2025-06-24', returnDate: null, status: 'pending', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-006', memberId: 'u-106', memberName: 'Patrick Iradukunda', memberEmail: 'patrick@example.com', resourceId: 'res-6', resourceTitle: 'Kingdom Marriage Principles', resourceType: 'Book', isbn: '978-4444444444', borrowDate: '2025-03-20', dueDate: '2025-04-03', returnDate: null, status: 'rejected', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-007', memberId: 'u-107', memberName: 'Sarah Uwase', memberEmail: 'sarah@example.com', resourceId: 'res-7', resourceTitle: 'Voices of the Revival', resourceType: 'Book', isbn: '978-5555555555', borrowDate: '2025-05-01', dueDate: '2025-05-15', returnDate: '2025-05-14', status: 'returned', renewalCount: 1, fineAmount: null, finePaid: false },
  { id: 'b-008', memberId: 'u-108', memberName: 'David Ndayisenga', memberEmail: 'davidn@example.com', resourceId: 'res-8', resourceTitle: 'The Discipleship Journey', resourceType: 'E-Book', isbn: '978-6666666666', borrowDate: '2025-05-02', dueDate: '2025-05-16', returnDate: null, status: 'overdue', renewalCount: 0, fineAmount: 800, finePaid: true },
  { id: 'b-009', memberId: 'u-109', memberName: 'Alice Mutoni', memberEmail: 'alicem@example.com', resourceId: 'res-9', resourceTitle: 'Financial Stewardship', resourceType: 'Book', isbn: '978-7777777777', borrowDate: '2025-06-12', dueDate: '2025-06-26', returnDate: null, status: 'active', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-010', memberId: 'u-110', memberName: 'Samuel Byiringiro', memberEmail: 'samuel@example.com', resourceId: 'res-10', resourceTitle: 'Raising Kingdom Families', resourceType: 'Book', isbn: '978-8888888888', borrowDate: '2025-04-01', dueDate: '2025-04-15', returnDate: '2025-04-20', status: 'returned', renewalCount: 0, fineAmount: 500, finePaid: true },
  { id: 'b-011', memberId: 'u-111', memberName: 'Esther Kabatesi', memberEmail: 'esther@example.com', resourceId: 'res-11', resourceTitle: 'The Kingdom Economy', resourceType: 'Book', isbn: '978-9999999999', borrowDate: '2025-06-15', dueDate: '2025-06-29', returnDate: null, status: 'pending', renewalCount: 0, fineAmount: null, finePaid: false },
  { id: 'b-012', memberId: 'u-112', memberName: 'Peter Niyonzima', memberEmail: 'peter@example.com', resourceId: 'res-12', resourceTitle: 'Divine Health & Wellness', resourceType: 'E-Book', isbn: '978-0000000001', borrowDate: '2025-06-08', dueDate: '2025-06-22', returnDate: null, status: 'active', renewalCount: 1, fineAmount: null, finePaid: false },
]
