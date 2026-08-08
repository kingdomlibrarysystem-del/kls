import { BookText, Calendar, CalendarCheck, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { statusConfig, type Borrowing } from '@/app/dashboard/library/borrowings/_components/borrowings-data'

interface BorrowingDetailModalProps {
  borrowing: Borrowing | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span style={{ color: 'var(--gold)', marginTop: 2 }} className="shrink-0">{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 70 }} className="shrink-0">{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}

/** Read-only details view for a single borrowing record. */
export function BorrowingDetailModal({ borrowing, onClose }: BorrowingDetailModalProps) {
  return (
    <Modal open={!!borrowing} onClose={onClose} title="Borrowing Details" size="sm">
      {borrowing && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{borrowing.resourceTitle}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{statusConfig[borrowing.status].label}</span>
          </div>

          <div className="card space-y-2">
            <DetailRow icon={<BookText size={13} />} label="Type" value={borrowing.resourceType} />
            <DetailRow icon={<Calendar size={13} />} label="Borrowed" value={borrowing.borrowDate} />
            <DetailRow icon={<CalendarCheck size={13} />} label={borrowing.status === 'returned' ? 'Was Due' : 'Due'} value={borrowing.dueDate} />
            {borrowing.returnDate && <DetailRow icon={<CalendarCheck size={13} />} label="Returned" value={borrowing.returnDate} />}
            <DetailRow icon={<Hash size={13} />} label="ISBN" value={borrowing.isbn} />
          </div>
        </div>
      )}
    </Modal>
  )
}
