import { User, Calendar, CalendarCheck, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Borrowing } from './borrowings-data'

interface BorrowingDetailModalProps {
  borrowing: Borrowing | null
  onClose: () => void
}

const statusColor: Record<Borrowing['status'], string> = {
  Active: 'var(--green-light)',
  Overdue: 'var(--red-light)',
  Returned: 'var(--text-muted)',
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
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{borrowing.title}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[borrowing.status], flexShrink: 0 }}>{borrowing.status}</span>
          </div>

          <div className="card space-y-2">
            <DetailRow icon={<User size={13} />} label="Author" value={borrowing.author} />
            <DetailRow icon={<Calendar size={13} />} label="Borrowed" value={borrowing.borrowed} />
            <DetailRow icon={<CalendarCheck size={13} />} label={borrowing.status === 'Returned' ? 'Was Due' : 'Due'} value={borrowing.due} />
            {borrowing.returned && <DetailRow icon={<CalendarCheck size={13} />} label="Returned" value={borrowing.returned} />}
            <DetailRow icon={<Hash size={13} />} label="ID" value={String(borrowing.id)} />
          </div>
        </div>
      )}
    </Modal>
  )
}
