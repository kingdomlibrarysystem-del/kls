import { User, CalendarDays, Users, CheckCircle2, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { statusConfig, type Reservation } from '@/app/dashboard/reservations/_components/reservations-data'

interface ReservationDetailModalProps {
  reservation: Reservation | null
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

/** Read-only details view for a single reservation record. */
export function ReservationDetailModal({ reservation, onClose }: ReservationDetailModalProps) {
  return (
    <Modal open={!!reservation} onClose={onClose} title="Reservation Details" size="sm">
      {reservation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{reservation.resourceTitle}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{statusConfig[reservation.status].label}</span>
          </div>

          <div className="card space-y-2">
            <DetailRow icon={<User size={13} />} label="Author" value={reservation.resourceAuthor} />
            <DetailRow icon={<CalendarDays size={13} />} label="Reserved" value={reservation.reservationDate} />
            {reservation.status === 'pending' && reservation.queuePosition > 0 && (
              <DetailRow icon={<Users size={13} />} label="Queue" value={`Position ${reservation.queuePosition}`} />
            )}
            {reservation.claimDeadline && <DetailRow icon={<CheckCircle2 size={13} />} label="Claim by" value={new Date(reservation.claimDeadline).toLocaleString()} />}
            <DetailRow icon={<Hash size={13} />} label="ID" value={reservation.id} />
          </div>
        </div>
      )}
    </Modal>
  )
}
