import { User, Mail, BookOpen, Calendar, Layers, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { statusConfig, type Reservation } from './reservations-data'
import { QueueBadge, ClaimCountdown } from './reservation-helpers'

interface ReservationDetailModalProps {
  reservation: Reservation | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-24 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium">{value}</span>
    </div>
  )
}

/** Read-only details view for a single reservation record. */
export function ReservationDetailModal({ reservation, onClose }: ReservationDetailModalProps) {
  return (
    <Modal open={!!reservation} onClose={onClose} title="Reservation Details" size="md">
      {reservation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cinzel text-base font-semibold text-w-950">{reservation.resourceTitle}</h3>
            <span className={`px-2.5 py-0.5 rounded border text-xs font-lato font-semibold ${statusConfig[reservation.status].cls}`}>
              {statusConfig[reservation.status].label}
            </span>
          </div>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<User size={13} />} label="Member" value={reservation.memberName} />
            <DetailRow icon={<Mail size={13} />} label="Email" value={reservation.memberEmail} />
            <DetailRow icon={<BookOpen size={13} />} label="Resource" value={`${reservation.resourceAuthor} · ${reservation.resourceType}`} />
            <DetailRow icon={<Layers size={13} />} label="Stock" value={`${reservation.totalCopies - reservation.borrowedCopies} of ${reservation.totalCopies} available`} />
            <DetailRow icon={<Calendar size={13} />} label="Reserved" value={reservation.reservationDate} />
            {['pending', 'notified'].includes(reservation.status) && (
              <DetailRow icon={<Layers size={13} />} label="Queue" value={<QueueBadge position={reservation.queuePosition} />} />
            )}
            {reservation.status === 'notified' && reservation.claimDeadline && (
              <DetailRow icon={<Clock size={13} />} label="Claim By" value={<ClaimCountdown deadline={reservation.claimDeadline} />} />
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
