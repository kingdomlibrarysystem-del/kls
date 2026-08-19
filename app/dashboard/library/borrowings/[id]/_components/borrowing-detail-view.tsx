'use client'

import { useEffect, useState } from 'react'
import {
  User, Mail, BookOpen, Calendar, RotateCcw, AlertTriangle, DollarSign,
  ArrowLeft, CheckCircle, XCircle, BookX,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { UniversalButton } from '@/components/ui/universal-button'
import { statusConfig, daysOverdue, type Borrowing } from '../../_components/borrowings-data'
import { approveBorrowing, rejectBorrowing, returnBorrowing, waiveFine } from '../../_components/use-borrowings-admin'

interface BorrowingDetailViewProps {
  id: string
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/**
 * Real details page for a single borrowing record, replacing the modal
 * that used to open from the Borrowings table's "View" button. Fetches
 * directly from /api/borrowings/:id (matching the Users pilot pattern)
 * rather than relying on the admin table's already-loaded list, and
 * reuses the same approve/reject/return/waiveFine mutators the table's
 * inline actions already call, so business rules stay in one place.
 */
export function BorrowingDetailView({ id }: BorrowingDetailViewProps) {
  const [borrowing, setBorrowing] = useState<Borrowing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionPending, setActionPending] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/borrowings/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return
        if (json.code !== 'success' || !json.data) {
          setError(json.message ?? 'Borrowing not found')
          return
        }
        setBorrowing(json.data)
      })
      .catch(() => { if (!cancelled) setError('Failed to load borrowing') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

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

  if (loading) {
    return (
      <div>
        <PageHeader title="Borrowing Details" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !borrowing) {
    return (
      <div>
        <PageHeader title="Borrowing Details" />
        <EmptyState icon={BookX} title="Borrowing not found" description={error || 'This borrowing record does not exist or was deleted.'} />
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

      {toast && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded font-lato text-sm">{toast}</div>}

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
