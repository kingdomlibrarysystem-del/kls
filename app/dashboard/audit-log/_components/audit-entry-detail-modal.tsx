import { User, Target, CalendarClock, Globe, Hash, StickyNote } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { auditActionLabels, type AuditEntry } from './audit-log-data'

interface AuditEntryDetailModalProps {
  entry: AuditEntry | null
  onClose: () => void
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-w-600 mt-0.5 shrink-0">{icon}</span>
      <span className="font-lato text-xs text-w-700 w-20 shrink-0">{label}</span>
      <span className="font-lato text-sm text-w-950 font-medium break-words">{value}</span>
    </div>
  )
}

/** Read-only details view for a single audit-log entry, including fields too dense for the table row (IP, notes). */
export function AuditEntryDetailModal({ entry, onClose }: AuditEntryDetailModalProps) {
  return (
    <Modal open={!!entry} onClose={onClose} title="Audit Entry Details" size="sm">
      {entry && (
        <div className="space-y-4">
          <span className="inline-block px-2.5 py-0.5 rounded border border-w-300 bg-w-100 text-w-950 text-xs font-lato font-semibold">
            {auditActionLabels[entry.action]}
          </span>

          <div className="bg-form-highlight border border-w-300 rounded p-3 space-y-2">
            <DetailRow icon={<User size={13} />} label="Actor" value={entry.actor} />
            <DetailRow icon={<Target size={13} />} label="Target" value={entry.target} />
            <DetailRow icon={<CalendarClock size={13} />} label="Time" value={entry.timestamp} />
            <DetailRow icon={<Globe size={13} />} label="IP" value={entry.ipAddress} />
            <DetailRow icon={<Hash size={13} />} label="ID" value={entry.id} />
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-lato text-xs font-semibold text-w-700 uppercase tracking-wide mb-1.5">
              <StickyNote size={12} /> Notes
            </p>
            <p className="font-lato text-sm text-w-700 leading-relaxed">{entry.notes}</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
