'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { initialData, daysOverdue, type Borrowing, type BorrowStatus } from './_components/borrowings-data'
import { BorrowingsStats } from './_components/borrowings-stats'
import { BorrowingsTable } from './_components/borrowings-table'
import { BorrowingDetailModal } from './_components/borrowing-detail-modal'

/** Borrowings Management: approval workflow (not a create-a-record page) plus a details view per row. */
export default function AdminBorrowingsPage() {
  const [data, setData] = useState<Borrowing[]>(initialData)
  const [statusFilter, setStatusFilter] = useState<BorrowStatus | 'all'>('all')
  const [toast, setToast] = useState('')
  const [viewing, setViewing] = useState<Borrowing | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const updateRow = (id: string, patch: Partial<Borrowing>) =>
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const handleApprove = (b: Borrowing) => { updateRow(b.id, { status: 'active' }); showToast(`Approved borrow for ${b.memberName}`) }
  const handleReject = (b: Borrowing) => { updateRow(b.id, { status: 'rejected' }); showToast(`Rejected borrow for ${b.memberName}`) }
  const handleReturn = (b: Borrowing) => {
    const fine = b.status === 'overdue' ? daysOverdue(b.dueDate) * 200 : null
    updateRow(b.id, { status: 'returned', returnDate: new Date().toISOString().split('T')[0], fineAmount: fine })
    showToast(`Return processed${fine ? ` — fine: ${fine.toLocaleString()} RWF` : ''}`)
  }
  const handleWaiveFine = (b: Borrowing) => { updateRow(b.id, { finePaid: true }); showToast(`Fine waived for ${b.memberName}`) }

  return (
    <PageTransition>
      <PageHeader title="Borrowings Management" subtitle="All member borrowings — approve, track, process returns and fines" />

      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <BorrowingsStats data={data} />

      <BorrowingsTable
        data={data}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onView={setViewing}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
        onWaiveFine={handleWaiveFine}
      />

      <BorrowingDetailModal borrowing={viewing} onClose={() => setViewing(null)} />
    </PageTransition>
  )
}
