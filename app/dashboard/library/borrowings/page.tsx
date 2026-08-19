'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { PageTransition } from '@/components/ui/page-transition'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuth } from '@/contexts/auth-context'
import { logAuditEvent } from '@/app/dashboard/audit-log/_components/use-audit-log'
import type { Borrowing, BorrowStatus } from './_components/borrowings-data'
import { useBorrowingsAdmin, approveBorrowing, rejectBorrowing, returnBorrowing, waiveFine } from './_components/use-borrowings-admin'
import { BorrowingsStats } from './_components/borrowings-stats'
import { BorrowingsTable } from './_components/borrowings-table'

/** Borrowings Management: approval workflow (not a create-a-record page) plus a details view per row. */
export default function AdminBorrowingsPage() {
  const { data, loading, error } = useBorrowingsAdmin()
  const [statusFilter, setStatusFilter] = useState<BorrowStatus | 'all'>('all')
  const [toast, setToast] = useState('')
  const { user: currentUser } = useAuth()
  const actorName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Staff User'

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label="Loading borrowings">
        <Skeleton style={{ height: 60, borderRadius: 8 }} />
        <Skeleton style={{ height: 300, borderRadius: 8 }} />
      </div>
    )
  }

  if (error) {
    return <EmptyState icon={AlertTriangle} title="Couldn't load borrowings" description={error} />
  }

  const handleApprove = async (b: Borrowing) => {
    try {
      await approveBorrowing(b.id)
      logAuditEvent({
        actor: actorName,
        action: 'BORROW_APPROVED',
        target: `${b.memberName} — ${b.resourceTitle}`,
        notes: 'Approved at circulation desk.',
      })
      showToast(`Approved borrow for ${b.memberName}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not approve this borrowing')
    }
  }
  const handleReject = async (b: Borrowing) => {
    try {
      await rejectBorrowing(b.id)
      showToast(`Rejected borrow for ${b.memberName}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not reject this borrowing')
    }
  }
  const handleReturn = async (b: Borrowing) => {
    try {
      const updated = await returnBorrowing(b.id)
      showToast(`Return processed${updated.fineAmount ? ` — fine: ${updated.fineAmount.toLocaleString()} RWF` : ''}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not process this return')
    }
  }
  const handleWaiveFine = async (b: Borrowing) => {
    try {
      await waiveFine(b.id)
      showToast(`Fine waived for ${b.memberName}`)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not waive this fine')
    }
  }

  return (
    <PageTransition>
      <PageHeader title="Borrowings Management" subtitle="All member borrowings — approve, track, process returns and fines" />

      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <BorrowingsStats data={data} />

      <BorrowingsTable
        data={data}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onApprove={handleApprove}
        onReject={handleReject}
        onReturn={handleReturn}
        onWaiveFine={handleWaiveFine}
      />
    </PageTransition>
  )
}
