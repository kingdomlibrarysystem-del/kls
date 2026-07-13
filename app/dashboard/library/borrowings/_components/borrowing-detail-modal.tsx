import { User, Mail, BookOpen, Calendar, RotateCcw, AlertTriangle, DollarSign } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { statusConfig, daysOverdue, type Borrowing } from './borrowings-data'

interface BorrowingDetailModalProps {
  borrowing: Borrowing | null
  onClose: () => void
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

/** Read-only details view for a single borrowing record. */
export function BorrowingDetailModal({ borrowing, onClose }: BorrowingDetailModalProps) {
  return (
    <Modal open={!!borrowing} onClose={onClose} title="Borrowing Details" size="md">
      {borrowing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{borrowing.resourceTitle}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[borrowing.status].cls}`}>
              {statusConfig[borrowing.status].label}
            </span>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
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
      )}
    </Modal>
  )
}
