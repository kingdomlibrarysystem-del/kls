'use client'

import { useState } from 'react'
import {
  User, Mail, BookOpen, Calendar, RotateCcw, AlertTriangle, DollarSign,
  ArrowLeft, CheckCircle, XCircle, BookX,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, daysOverdue, type Borrowing } from '../../_components/borrowings-data'
import { approveBorrowing, rejectBorrowing, returnBorrowing, waiveFine } from '../../_components/use-borrowings-admin'

interface BorrowingDetailViewProps {
  /** Loaded on the server by page.tsx (which 404s when missing) — no fetch on mount. */
  initialBorrowing: Borrowing
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium" suppressHydrationWarning>{value}</span>
    </div>
  )
}

/**
 * Real details page for a single borrowing record, replacing the modal
 * that used to open from the Borrowings table's "View" button. The record
 * is loaded on the server by page.tsx, and the view
 * reuses the same approve/reject/return/waiveFine mutators the table's
 * inline actions already call, so business rules stay in one place.
 */
export function BorrowingDetailView({ initialBorrowing }: BorrowingDetailViewProps) {
  const [borrowing, setBorrowing] = useState<Borrowing | null>(initialBorrowing)
  const [actionPending, setActionPending] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const runAction = async (action: (borrowId: string) => Promise<Borrowing>, successMsg: string, failMsg: string) => {
    if (!borrowing) return
    setActionPending(true)
    try {
      const updated = await action(borrowing.id)
      setBorrowing(updated)
      showToast(successMsg)
    } catch (e) {
      showToast(e instanceof Error ? e.message : failMsg)
    } finally {
      setActionPending(false)
    }
  }

  if (!borrowing) {
    return (
      <div>
        <PageHeader title="Borrowing Details" />
        <EmptyState icon={BookX} title="Borrowing not found" description={'This borrowing record does not exist or was deleted.'} />
        <div className="mt-4">
          <UniversalButton href="/dashboard/library/borrowings" variant="outline" icon={<ArrowLeft size={14} />}>
            Back to Borrowings
          </UniversalButton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <UniversalButton href="/dashboard/library/borrowings" variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>
          Back to Borrowings
        </UniversalButton>
        <div className="flex gap-2 flex-wrap justify-end">
          {borrowing.status === 'pending' && (
            <>
              <UniversalButton
                variant="outline"
                size="sm"
                icon={<CheckCircle size={13} />}
                loading={actionPending}
                onClick={() => runAction(approveBorrowing, `Approved borrow for ${borrowing.memberName}`, 'Could not approve this borrowing')}
              >
                Approve
              </UniversalButton>
              <UniversalButton
                variant="destructive"
                size="sm"
                icon={<XCircle size={13} />}
                loading={actionPending}
                onClick={() => runAction(rejectBorrowing, `Rejected borrow for ${borrowing.memberName}`, 'Could not reject this borrowing')}
              >
                Reject
              </UniversalButton>
            </>
          )}
          {(borrowing.status === 'active' || borrowing.status === 'overdue') && (
            <UniversalButton
              variant="outline"
              size="sm"
              icon={<RotateCcw size={13} />}
              loading={actionPending}
              onClick={() => runAction(returnBorrowing, 'Return processed', 'Could not process this return')}
            >
              Return
            </UniversalButton>
          )}
          {borrowing.fineAmount !== null && !borrowing.finePaid && (
            <UniversalButton
              variant="outline"
              size="sm"
              icon={<AlertTriangle size={13} />}
              loading={actionPending}
              onClick={() => runAction(waiveFine, `Fine waived for ${borrowing.memberName}`, 'Could not waive this fine')}
            >
              Waive Fine
            </UniversalButton>
          )}
        </div>
      </div>

      {toast && <div className="mb-4 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 text-green-800 dark:text-success px-4 py-3 rounded font-lato text-sm">{toast}</div>}

      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-cinzel text-xl font-semibold text-w-950">{borrowing.resourceTitle}</h1>
          <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[borrowing.status].cls}`}>
            {statusConfig[borrowing.status].label}
          </span>
        </div>

        <div className="bg-form-highlight border border-w-300 rounded p-4 space-y-3">
          <DetailRow icon={<User size={13} />} label="Member" value={borrowing.memberName} />
          <DetailRow icon={<Mail size={13} />} label="Email" value={borrowing.memberEmail} />
          <DetailRow icon={<BookOpen size={13} />} label="Resource" value={`${borrowing.resourceType} · ${borrowing.isbn}`} />
          <DetailRow icon={<Calendar size={13} />} label="Borrowed" value={borrowing.borrowDate} />
          <DetailRow icon={<Calendar size={13} />} label={borrowing.returnDate ? 'Returned' : 'Due'} value={borrowing.returnDate ?? borrowing.dueDate} />
          <DetailRow icon={<RotateCcw size={13} />} label="Renewals" value={String(borrowing.renewalCount)} />
          {borrowing.status === 'overdue' && (
            <DetailRow icon={<AlertTriangle size={13} />} label="Overdue" value={`${daysOverdue(borrowing.dueDate)} days`} />
          )}
          {borrowing.fineAmount !== null && (
            <DetailRow icon={<DollarSign size={13} />} label="Fine" value={`${borrowing.fineAmount.toLocaleString()} RWF${borrowing.finePaid ? ' (waived)' : ''}`} />
          )}
        </div>
      </div>
    </div>
  )
}
