import { User, CalendarDays, Users, CheckCircle2, Hash } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Reservation } from './reservations-data'

interface ReservationDetailModalProps {
  reservation: Reservation | null
  onClose: () => void
}

const statusColor: Record<Reservation['status'], string> = {
  Ready: 'var(--green-light)',
  Waiting: 'var(--gold)',
  Fulfilled: 'var(--text-muted)',
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
            <h3 className="cinzel" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{reservation.title}</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[reservation.status], flexShrink: 0 }}>{reservation.status}</span>
          </div>

          <div className="card space-y-2">
            <DetailRow icon={<User size={13} />} label="Author" value={reservation.author} />
            <DetailRow icon={<CalendarDays size={13} />} label="Reserved" value={reservation.reserved} />
            {typeof reservation.queue === 'number' && reservation.queue > 0 && (
              <DetailRow icon={<Users size={13} />} label="Queue" value={`${reservation.queue} ahead of you`} />
            )}
            {reservation.fulfilled && <DetailRow icon={<CheckCircle2 size={13} />} label="Fulfilled" value={reservation.fulfilled} />}
            <DetailRow icon={<Hash size={13} />} label="ID" value={String(reservation.id)} />
          </div>
        </div>
      )}
    </Modal>
  )
}
